"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setError("パスワードが正しくありません");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background-tertiary)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "2rem",
          width: "100%",
          maxWidth: "340px",
        }}
      >
        {/* ロゴ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "1.75rem",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              background: "#1D9E75",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="white">
              <path d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6Z" />
            </svg>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            RaceBase
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">パスワード</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              autoFocus
              required
            />
          </div>
          {error && (
            <div
              style={{
                fontSize: "11px",
                color: "#991b1b",
                marginBottom: "0.75rem",
                padding: "6px 8px",
                background: "#fee2e2",
                borderRadius: "4px",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", fontSize: "13px", padding: "8px" }}
          >
            {loading ? "認証中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
