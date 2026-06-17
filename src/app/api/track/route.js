import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const LIMIT = 5;
const WINDOW = 60; // seconds

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClientIp(req) {
  return req.headers.get("cf-connecting-ip") ||
         req.headers.get("x-real-ip") ||
         req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         "anonymous";
}

function getFingerprint(req) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

export async function POST(req) {
  const ip = getClientIp(req);
  const fingerprint = getFingerprint(req);
  
  const rateLimitKey = `ratelimit:track:${fingerprint}`;
  const blockKey = `block:track:${fingerprint}`;
  const failKey = `failed:track:${fingerprint}`;

  try {
    // Helper to safely execute redis operations with fallback
    const safeRedis = {
      get: async (key) => {
        try { return await redis.get(key); } catch (e) { console.warn("[REDIS ERROR]", e.message); return null; }
      },
      set: async (key, val, mode, duration) => {
        try { return await redis.set(key, val, mode, duration); } catch (e) { console.warn("[REDIS ERROR]", e.message); return null; }
      },
      incr: async (key) => {
        try { return await redis.incr(key); } catch (e) { console.warn("[REDIS ERROR]", e.message); return 1; }
      },
      expire: async (key, duration) => {
        try { return await redis.expire(key, duration); } catch (e) { console.warn("[REDIS ERROR]", e.message); return false; }
      },
      del: async (key) => {
        try { return await redis.del(key); } catch (e) { console.warn("[REDIS ERROR]", e.message); return 0; }
      }
    };

    // 1. Check if the client fingerprint is blocked
    const isBlocked = await safeRedis.get(blockKey);
    if (isBlocked) {
      console.warn(`[SECURITY MONITORING] Blocked tracking request from IP/Fingerprint: ${ip}/${fingerprint} (Active Block)`);
      return NextResponse.json(
        { message: "Akses diblokir sementara karena terlalu banyak kegagalan. Silakan coba lagi nanti." },
        { status: 403 }
      );
    }

    // 2. Rate limiting
    const currentRequests = await safeRedis.incr(rateLimitKey);
    if (currentRequests === 1) {
      await safeRedis.expire(rateLimitKey, WINDOW);
    }
    if (currentRequests > LIMIT) {
      console.warn(`[SECURITY MONITORING] Rate limit hit on tracking endpoint. IP/Fingerprint: ${ip}/${fingerprint}`);
      return NextResponse.json(
        { message: "Terlalu banyak request. Maksimal 5 kali per menit." },
        { status: 429 }
      );
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const { ticket, trackingToken } = body;

    // Strict input validation
    if (!ticket || !trackingToken || !UUID_REGEX.test(ticket) || !UUID_REGEX.test(trackingToken)) {
      // Malformed inputs count as a failed attempt to prevent scanning
      const fails = await safeRedis.incr(failKey);
      if (fails === 1) {
        await safeRedis.expire(failKey, 600); // 10 minutes window
      }
      if (fails >= 5) {
        await safeRedis.set(blockKey, "1", "EX", 3600); // block for 1 hour
        console.warn(`[SECURITY MONITORING] Fingerprint ${fingerprint} blocked for 1 hour after ${fails} failed tracking attempts.`);
      }
      return NextResponse.json(
        { message: "Format tiket atau token tidak valid" },
        { status: 400 }
      );
    }

    // 4. Query ticket with both UUID and tracking token
    const found = await prisma.ticket.findFirst({
      where: {
        ticketNumber: ticket,
        trackingToken: trackingToken
      }
    });

    if (!found) {
      // Wrong credentials - count failed attempt
      const fails = await safeRedis.incr(failKey);
      if (fails === 1) {
        await safeRedis.expire(failKey, 600); // 10 minutes window
      }
      if (fails >= 5) {
        await safeRedis.set(blockKey, "1", "EX", 3600); // block for 1 hour
        console.warn(`[SECURITY MONITORING] Fingerprint ${fingerprint} blocked for 1 hour after ${fails} failed tracking attempts.`);
      }

      console.warn(`[SECURITY MONITORING] Failed ticket tracking attempt. IP: ${ip}, Ticket: ${ticket}`);
      return NextResponse.json(
        { message: "Nomor tiket atau token pelacakan salah" },
        { status: 404 }
      );
    }

    // 5. Success - reset failed attempts, create audit log, and return filtered response
    await safeRedis.del(failKey);

    // Create secure audit log entry in the database
    await prisma.ticketAuditLog.create({
      data: {
        ticketId: found.id,
        type: "GENERAL_ACTION",
        actorId: null,
        metadata: {
          action: "TICKET_TRACKED",
          ip: crypto.createHash("sha256").update(ip).digest("hex"), // Mask IP for PII protection in logs
          ua: req.headers.get("user-agent") || "unknown"
        }
      }
    });

    console.info(`[SECURITY MONITORING] Successful ticket tracking. Ticket ID: ${found.id}`);

    // Return filtered public response (PII shielded) and set secure cookie
    const response = NextResponse.json({
      success: true,
      ticket: {
        ticketId: found.id,
        status: found.status,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt
      }
    });

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret not configured");
    }

    const trackedToken = jwt.sign(
      { ticketId: found.id, action: "view_attachments" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    response.cookies.set("tracked_session", trackedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60, // 2 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("TRACK API ERROR:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
