"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const Navbar = ({ ticketCount = 0 }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target))
        setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const links = [
    {
      href: "/",
      icon: "✏️",
      label: "Buat Tiket",
      desc: "Sampaikan aspirasi Anda",
    },
    {
      href: "/track",
      icon: "🔍",
      label: "Lacak Tiket",
      desc: "Cek status tiket Anda",
    },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 480px) {
          .nav-logo-text { display: none !important; }
        }
      `}</style>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav
        style={{
          background:
            "linear-gradient(135deg, #1A3A8F 0%, #1E50A2 60%, #29ABE2 100%)",
          boxShadow: "0 2px 20px rgba(26,58,143,0.28)",
          position: "sticky",
          top: 0,
          zIndex: 200,
        }}
      >
        {/* Top strip */}
        <div
          style={{
            background: "rgba(0,0,0,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            padding: "4px 20px",
            fontSize: 11,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 0.4,
            fontWeight: 500,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              display: "inline-block",
              paddingLeft: "100%",
              animation: "marquee 15s linear infinite",
            }}
          >
            Balai Pelatihan Talenta Komunikasi dan Digital · Kementerian
            Komunikasi dan Digital RI
          </div>
          <style>
            {`@keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-100%); }
            }`}
          </style>
        </div>

        {/* Main bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 20px",
            height: 62,
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 5,
              width: 40,
              height: 40,
              borderRadius: 10,
              background: open
                ? "rgba(255,255,255,0.22)"
                : "rgba(255,255,255,0.12)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  height: 2,
                  borderRadius: 2,
                  background: "#fff",
                  width: i === 1 && open ? 12 : 18,
                  opacity: i === 1 && open ? 0.5 : 1,
                  transition: "all 0.25s",
                }}
              />
            ))}
          </button>

          {/* Logo BPT Komdigi */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            <div
              style={{
                height: 40,
                width: 72,
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
                padding: "4px 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/bpt-komdigi.png"
                alt="BPT Komdigi"
                style={{ height: "100%", width: "100%", objectFit: "contain" }}
              />
            </div>
            <div>
              <div
                className="nav-logo-text"
                style={{
                  fontWeight: 800,
                  fontSize: 17,
                  color: "#fff",
                  letterSpacing: -0.3,
                  lineHeight: 1.1,
                }}
              >
                MyAspirasi
              </div>
              <div
                className="nav-logo-text"
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: 0.3,
                  fontWeight: 500,
                }}
              >
                BPT Komdigi
              </div>
            </div>
          </div>

          {/* Ticket count (Admin) */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {ticketCount > 0 && (
              <div
                style={{
                  background: "#F7C200",
                  color: "#1A3A8F",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {ticketCount}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(26,58,143,0.4)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div
        ref={sidebarRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 288,
          zIndex: 400,
          background: "#fff",
          boxShadow: "4px 0 32px rgba(26,58,143,0.15)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Sidebar header gradient */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #1A3A8F 0%, #1E50A2 60%, #29ABE2 100%)",
            padding: "24px 20px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Logo BPT Komdigi di sidebar */}
              <div
                style={{
                  width: 64,
                  height: 36,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#fff",
                  padding: "4px 6px",
                  flexShrink: 0,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/bpt-komdigi.png"
                  alt="BPT Komdigi"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#fff",
                    lineHeight: 1.1,
                  }}
                >
                  MyAspirasi
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.65)",
                    fontWeight: 500,
                    marginTop: 2,
                  }}
                >
                  BPT Komdigi
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 0.3,
              lineHeight: 1.7,
            }}
          >
            Balai Pelatihan Talenta Komunikasi dan Digital
            <br />
            Kementerian Komunikasi dan Digital RI
          </div>
        </div>

        {/* Yellow accent strip */}
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, #F7C200, #C0272D, #29ABE2)",
          }}
        />

        {/* Nav label */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#94A3B8",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Navigasi
          </div>
        </div>

        {/* Menu items */}
        <div style={{ padding: "0 12px", flex: 1 }}>
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <button
                key={link.href}
                onClick={() => {
                  router.push(link.href);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  marginBottom: 6,
                  background: active ? "#E8EEF8" : "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  borderLeft: active
                    ? "3px solid #1A3A8F"
                    : "3px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "#F0F5FB";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: active ? "#C8D8EE" : "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {link.icon}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: active ? "#1A3A8F" : "#0F1F4B",
                    }}
                  >
                    {link.label}
                    {link.href === "/dashboard" && ticketCount > 0 && (
                      <span
                        style={{
                          marginLeft: 8,
                          background: "#F7C200",
                          color: "#1A3A8F",
                          borderRadius: 999,
                          padding: "1px 7px",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {ticketCount}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94A3B8",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    {link.desc}
                  </div>
                </div>
                {active && (
                  <div
                    style={{
                      marginLeft: "auto",
                      color: "#1A3A8F",
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    ›
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer sidebar */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #E2E8F0",
            fontSize: 11,
            color: "#94A3B8",
            lineHeight: 1.7,
          }}
        >
          © 2026 BPT Komdigi
          <br />
          Kementerian Komunikasi dan Digital RI
        </div>
      </div>
    </>
  );
};

export default Navbar;
