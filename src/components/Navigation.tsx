"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const tabs = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "選手", href: "/athletes" },
  { label: "チーム", href: "/teams" },
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
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        padding: "0 1rem",
        display: "flex",
        alignItems: "center",
        height: "44px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* ロゴ */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--color-text-primary)",
          marginRight: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            background: "#1D9E75",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 16 16" width="11" height="11" fill="white">
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
                color: isActive ? "#0F6E56" : "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                borderBottom: isActive
                  ? "2px solid #1D9E75"
                  : "2px solid transparent",
                fontWeight: isActive ? 500 : undefined,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
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
          border: "0.5px solid var(--color-border-secondary)",
          background: "none",
          color: "var(--color-text-secondary)",
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
