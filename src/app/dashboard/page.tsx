"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  athleteCount: number;
  recordCount: number;
  teamCount: number;
  recentRecords: { id: string; event: string; timeString: string; competitionName: string; date: string; athlete: { nameKanji: string } }[];
  recentCompetitions: { competitionName: string; date: string }[];
}

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}
function formatDateFull(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <>
      <div className="page-header">
        <div className="page-title">ダッシュボード</div>
        <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{dateStr}</span>
      </div>

      {/* メトリクス */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">登録選手数</div>
          <div className="metric-value">{data?.athleteCount ?? "—"}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">総記録数</div>
          <div className="metric-value">{data?.recordCount ?? "—"}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">登録チーム数</div>
          <div className="metric-value">{data?.teamCount ?? "—"}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">データ状態</div>
          <div className="metric-value" style={{ fontSize: "14px", paddingTop: "3px" }}>
            {data ? "✓ 正常" : "読込中"}
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* 最近登録した記録 */}
        <div className="card">
          <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "0.65rem" }}>最近登録した記録</div>
          {!data ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>読み込み中...</div>
          ) : data.recentRecords.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>記録がありません</div>
          ) : (
            <table className="data-table">
              <colgroup>
                <col style={{ width: "35%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "40%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>選手</th>
                  <th>種目</th>
                  <th>記録</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href="/athletes" className="link-text">{r.athlete.nameKanji}</Link>
                    </td>
                    <td>{r.event}</td>
                    <td style={{ fontWeight: 500 }}>{r.timeString}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 直近の大会 */}
        <div className="card">
          <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "0.65rem" }}>直近の大会</div>
          {!data ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>読み込み中...</div>
          ) : data.recentCompetitions.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>大会データがありません</div>
          ) : (
            <table className="data-table">
              <colgroup>
                <col style={{ width: "60%" }} />
                <col style={{ width: "40%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>大会名</th>
                  <th>日付</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCompetitions.map((c, i) => (
                  <tr key={i}>
                    <td>{c.competitionName}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{formatDate(c.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* クイックリンク */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "0.65rem" }}>クイックアクション</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/athletes" className="btn">選手を管理</Link>
          <Link href="/teams" className="btn">チームを管理</Link>
          <Link href="/import" className="btn">記録を取り込む</Link>
          <Link href="/rankings" className="btn">ランキングを見る</Link>
          <Link href="/watching-setup" className="btn btn-primary">観戦セットアップ →</Link>
        </div>
      </div>
    </>
  );
}
