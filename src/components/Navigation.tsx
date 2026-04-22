"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const tabs = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "選手", href: "/athletes" },
  { label: "チーム", href: "/teams" },
  { label: "大会", href: "/competitions" },
  { label: "ランキング", href: "/rankings" },
  { label: "記録取り込み", href: "/import" },
  { label: "観戦セットアップ", href: "/watching-setup" },
  { label: "観戦モード", href: "/watching" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "#0f1729",
        borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        padding: "0 1rem",
        display: "flex",
        alignItems: "center",
        height: "44px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 1px 8px rgba(0,0,0,0.4)",
      }}
    >
      {/* ロゴ */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#e8edf5",
          marginRight: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
          letterSpacing: "0.02em",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "20px",
            background: "linear-gradient(135deg, #06b6d4, #0891b2)",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 8px rgba(6,182,212,0.4)",
          }}
        >
          <svg viewBox="0 0 16 16" width="11" height="11" fill="#090e1a">
            <path d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6Z" />
          </svg>
        </div>
        RaceBase
      </div>

      {/* タブ */}
      <div
        className="nav-tabs"
        style={{
          display: "flex",
          height: "100%",
          overflowX: "auto",
          flex: 1,
        }}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "0 13px",
                fontSize: "12px",
                color: isActive ? "#06b6d4" : "#7a8baa",
                display: "flex",
                alignItems: "center",
                borderBottom: isActive
                  ? "2px solid #06b6d4"
                  : "2px solid transparent",
                fontWeight: isActive ? 500 : undefined,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* ログアウト */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        style={{
          fontSize: "11px",
          padding: "3px 8px",
          borderRadius: "4px",
          border: "0.5px solid rgba(255,255,255,0.12)",
          background: "none",
          color: "#7a8baa",
          cursor: "pointer",
          flexShrink: 0,
          marginLeft: "8px",
        }}
      >
        ログアウト
      </button>
    </nav>
  );
}
