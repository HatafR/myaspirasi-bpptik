"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

const Navbar = ({ ticketCount = 0 }) => {
  const pathname   = usePathname();
  const router     = useRouter();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const links = [
    { href: "/",          icon: "✏️", label: "Buat Tiket",  desc: "Sampaikan aspirasi Anda" },
    { href: "/dashboard", icon: "📊", label: "Dashboard",   desc: "Monitoring & statistik" },
  ];

  return (
    <>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{
        background: "linear-gradient(135deg, #0A2156 0%, #1565C0 100%)",
        boxShadow: "0 2px 20px rgba(10,33,86,0.25)",
        position: "sticky", top: 0, zIndex: 200,
      }}>
        {/* Top strip */}
        <div style={{
          background: "rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "5px 20px",
          fontSize: 11, color: "rgba(255,255,255,0.65)",
          letterSpacing: 0.4, fontWeight: 500,
        }}>
          Balai Pelatihan dan Pengembangan Teknologi Informasi dan Komunikasi · Kementerian Komunikasi dan Digital RI
        </div>

        {/* Main bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", height: 62 }}>

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              display: "flex", flexDirection: "column", justifyContent: "center",
              alignItems: "center", gap: 5,
              width: 40, height: 40, borderRadius: 10,
              background: open ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.2)",
              cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
            }}
          >
            {[0,1,2].map((i) => (
              <span key={i} style={{
                display: "block", height: 2, borderRadius: 2, background: "#fff",
                width: i === 1 && open ? 12 : 18,
                opacity: i === 1 && open ? 0.5 : 1,
                transition: "all 0.25s",
              }} />
            ))}
          </button>

          {/* Logo BPPTIK + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={() => router.push("/")}>
            <div style={{
              width: 38, height: 38, borderRadius: 9, overflow: "hidden",
              background: "rgba(255,255,255,0.95)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 3,
            }}>
              <img src="/logo-bpptik.jpg" alt="BPPTIK"
                style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: -0.3, lineHeight: 1.1 }}>
                MyAspirasi
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: 0.3, fontWeight: 500 }}>
                BPPTIK · Komdigi
              </div>
            </div>
          </div>

          {/* Active page indicator */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600,
              background: "rgba(255,255,255,0.1)", borderRadius: 8,
              padding: "5px 14px", border: "1px solid rgba(255,255,255,0.15)",
            }}>
              {links.find((l) => l.href === pathname)?.icon}{" "}
              {links.find((l) => l.href === pathname)?.label || "MyAspirasi"}
            </div>
            {ticketCount > 0 && (
              <div style={{
                background: "#F59E0B", color: "#fff",
                borderRadius: 999, padding: "3px 10px",
                fontSize: 12, fontWeight: 800,
              }}>{ticketCount}</div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div onClick={() => setOpen(false)} style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(10,33,86,0.4)",
        backdropFilter: "blur(3px)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.25s",
      }} />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div ref={sidebarRef} style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 280, zIndex: 400,
        background: "#fff",
        boxShadow: "4px 0 32px rgba(10,33,86,0.15)",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Sidebar header */}
        <div style={{
          background: "linear-gradient(135deg, #0A2156, #1565C0)",
          padding: "24px 20px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Logo BPPTIK */}
              <div style={{
                width: 52, height: 52, borderRadius: 12, overflow: "hidden",
                background: "#fff", padding: 5, flexShrink: 0,
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}>
                <img src="/logo-bpptik.jpg" alt="BPPTIK"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", lineHeight: 1.1 }}>MyAspirasi</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginTop: 2 }}>BPPTIK · Komdigi</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>✕</button>
          </div>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.5)",
            letterSpacing: 0.3, lineHeight: 1.6,
          }}>
            Balai Pelatihan dan Pengembangan<br />
            Teknologi Informasi dan Komunikasi<br />
            Kementerian Komunikasi dan Digital RI
          </div>
        </div>

        {/* Divider label */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "#94A3B8",
            letterSpacing: 1.2, textTransform: "uppercase",
          }}>Navigasi</div>
        </div>

        {/* Menu items */}
        <div style={{ padding: "0 12px", flex: 1 }}>
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <button key={link.href}
                onClick={() => { router.push(link.href); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "none", marginBottom: 6,
                  background: active ? "#EFF6FF" : "transparent",
                  cursor: "pointer", fontFamily: "inherit",
                  borderLeft: active ? "3px solid #1565C0" : "3px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F8FAFF"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: active ? "#DBEAFE" : "#F1F5F9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>{link.icon}</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: active ? "#1565C0" : "#0F2744" }}>
                    {link.label}
                    {link.href === "/dashboard" && ticketCount > 0 && (
                      <span style={{
                        marginLeft: 8, background: "#F59E0B", color: "#fff",
                        borderRadius: 999, padding: "1px 7px", fontSize: 11, fontWeight: 800,
                      }}>{ticketCount}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginTop: 2 }}>{link.desc}</div>
                </div>
                {active && <div style={{ marginLeft: "auto", color: "#1565C0", fontSize: 18, fontWeight: 800 }}>›</div>}
              </button>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid #E2E8F0",
          fontSize: 11, color: "#94A3B8", lineHeight: 1.6,
        }}>
          © 2026 BPPTIK · Kementerian Komunikasi<br />dan Digital Republik Indonesia
        </div>
      </div>
    </>
  );
};

export default Navbar;