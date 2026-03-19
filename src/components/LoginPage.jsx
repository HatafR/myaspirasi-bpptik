"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Username/email dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      localStorage.setItem("token", result.data.token);

      localStorage.setItem("user_session", JSON.stringify(result.data.user));

      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0F1F4B 0%, #1A3A8F 50%, #1E50A2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: -40,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "rgba(41,171,226,0.08)",
        }}
      />

      {/* Card */}
      <div
        className="fade-up"
        style={{
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 24px 64px rgba(10,20,60,0.35)",
          width: "100%",
          maxWidth: 420,
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Card header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
            padding: "32px 32px 28px",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 80,
              height: 44,
              margin: "0 auto 16px",
              background: "#fff",
              borderRadius: 10,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/bpt-komdigi.png"
              alt="BPT Komdigi"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: 900,
              margin: "0 0 4px",
              letterSpacing: -0.3,
            }}
          >
            MyAspirasi
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 13,
              margin: 0,
              fontWeight: 500,
            }}
          >
            Portal Internal BPT Komdigi
          </p>
        </div>

        {/* Yellow accent */}
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, #1A3A8F, #F7C200, #29ABE2)",
          }}
        />

        {/* Form */}
        <div style={{ padding: "28px 32px 32px" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0F1F4B",
              marginBottom: 6,
            }}
          >
            Masuk ke Akun Anda
          </div>
          <div style={{ fontSize: 13, color: "#5A6E8C", marginBottom: 24 }}>
            Masukkan kredensial akun internal Anda
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#C0272D",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Username/Email */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0F1F4B",
                display: "block",
                marginBottom: 7,
              }}
            >
              Username atau Email
            </label>
            <input
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                border: "1.5px solid #C8D8EE",
                outline: "none",
                fontSize: 14,
                color: "#0F1F4B",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              placeholder="username atau email@bptkomdigi.go.id"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError("");
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1E50A2")}
              onBlur={(e) => (e.target.style.borderColor = "#C8D8EE")}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0F1F4B",
                display: "block",
                marginBottom: 7,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                style={{
                  width: "100%",
                  padding: "11px 44px 11px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #C8D8EE",
                  outline: "none",
                  fontSize: 14,
                  color: "#0F1F4B",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1E50A2")}
                onBlur={(e) => (e.target.style.borderColor = "#C8D8EE")}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#5A6E8C",
                  padding: 4,
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 12,
              border: "none",
              background: loading
                ? "#C8D8EE"
                : "linear-gradient(135deg, #1A3A8F, #1E50A2)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: 0.2,
              boxShadow: loading ? "none" : "0 4px 16px rgba(26,58,143,0.3)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "⏳ Memverifikasi..." : "🔐 Masuk"}
          </button>

          {/* Back to public */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#5A6E8C",
                fontFamily: "inherit",
                fontWeight: 600,
              }}
            >
              ← Kembali ke halaman utama
            </button>
          </div>
        </div>
      </div>

      {/* Dummy credentials hint */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 20px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 12,
          maxWidth: 420,
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Demo Credentials
        </div>
        {[
          ["Admin General", "admin.general", "admin123"],
          ["Admin IT", "admin.it", "it123"],
          ["Admin Humas", "admin.humas", "humas123"],
        ].map(([role, user, pass]) => (
          <div
            key={role}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 4,
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              alignItems: "center",
            }}
          >
            <span style={{ minWidth: 100, fontWeight: 600 }}>{role}</span>
            <span
              style={{
                fontFamily: "monospace",
                background: "rgba(255,255,255,0.08)",
                padding: "1px 7px",
                borderRadius: 4,
              }}
            >
              {user}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                background: "rgba(255,255,255,0.08)",
                padding: "1px 7px",
                borderRadius: 4,
              }}
            >
              {pass}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          zIndex: 1,
        }}
      >
        © 2026 BPT Komdigi · Kementerian Komunikasi dan Digital RI
      </div>
    </div>
  );
};

export default LoginPage;
