"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { EVENTS } from "@/lib/timeUtils";

interface RankingRecord {
  id: string;
  timeString: string;
  competitionName: string;
  date: string;
  athleteId: string;
  athlete: { id: string; nameKanji: string; gender: string; teamName: string | null };
  team: { name: string } | null;
}

const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
}

function RankNum({ n }: { n: number }) {
  if (n === 1) return <span style={{ fontWeight: 600, color: "#1D9E75" }}>1</span>;
  if (n === 2) return <span style={{ fontWeight: 600, color: "#5DCAA5" }}>2</span>;
  return <span style={{ color: "var(--color-text-secondary)" }}>{n}</span>;
}

export default function RankingsPage() {
  const [records, setRecords] = useState<RankingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ event: "マラソン", gender: "", year: "" });

  const load = useCallback(() => {
    if (!filters.event) return;
    setLoading(true);
    const p = new URLSearchParams();
    p.set("event", filters.event);
    if (filters.gender) p.set("gender", filters.gender);
    if (filters.year) p.set("year", filters.year);
    fetch(`/api/rankings?${p}`)
      .then((r) => r.json())
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <div className="page-title">ランキング</div>
      </div>

      <div className="filter-bar">
        <select
          value={filters.event}
          onChange={(e) => setFilters((p) => ({ ...p, event: e.target.value }))}
          style={{ flex: "none", minWidth: "130px" }}
        >
          <option value="">種目を選択...</option>
          {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <select
          value={filters.gender}
          onChange={(e) => setFilters((p) => ({ ...p, gender: e.target.value }))}
          style={{ flex: "none", minWidth: "90px" }}
        >
          <option value="">全性別</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
        </select>
        <select
          value={filters.year}
          onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
          style={{ flex: "none", minWidth: "100px" }}
        >
          <option value="">全期間</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {!filters.event ? (
          <div style={{ padding: "2rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>種目を選択してください</div>
        ) : loading ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>読み込み中...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>該当する記録がありません</div>
        ) : (
          <table className="data-table">
            <colgroup>
              <col style={{ width: "7%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "33%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>順</th>
                <th>選手名</th>
                <th>記録</th>
                <th>所属</th>
                <th>大会</th>
                <th>日付</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id}>
                  <td><RankNum n={i + 1} /></td>
                  <td>
                    <Link href={`/athletes/${r.athlete.id}`} className="link-text">{r.athlete.nameKanji}</Link>
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.timeString}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{r.team?.name || r.athlete.teamName || "—"}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{r.competitionName}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{formatDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {records.length > 0 && (
        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{records.length}件（選手ごとの最速記録）</div>
      )}
    </>
  );
}
