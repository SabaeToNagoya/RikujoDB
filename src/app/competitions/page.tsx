"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";

interface CompetitionRecord {
  id: string;
  date: string;
  event: string;
  timeString: string;
  competitionName: string;
  segment: string | null;
  notes: string | null;
  athlete: { id: string; nameKanji: string };
  team: { name: string } | null;
}

interface Combination {
  year: number;
  name: string;
  event: string;
  segment: string;
}

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
}

// 区間の並び順（"1区" → 1 のように数値でソート）
function segmentOrder(s: string): number {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1]) : 999;
}

// 種目が駅伝かどうか
function isEkiden(event: string) {
  return event.includes("駅伝");
}

export default function CompetitionsPage() {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [filters, setFilters] = useState({ year: "", name: "", event: "", segment: "" });
  const [records, setRecords] = useState<CompetitionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/competitions/options")
      .then((r) => r.json())
      .then(setCombinations);
  }, []);

  // --- 連動する選択肢の計算 ---

  const availableYears = useMemo(() => {
    const filtered = combinations.filter(
      (c) =>
        (!filters.name || c.name === filters.name) &&
        (!filters.event || c.event === filters.event) &&
        (!filters.segment || c.segment === filters.segment)
    );
    const set = new Set(filtered.map((c) => c.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [combinations, filters.name, filters.event, filters.segment]);

  const availableNames = useMemo(() => {
    const filtered = combinations.filter(
      (c) =>
        (!filters.year || c.year === Number(filters.year)) &&
        (!filters.event || c.event === filters.event) &&
        (!filters.segment || c.segment === filters.segment)
    );
    const set = new Set(filtered.map((c) => c.name));
    return Array.from(set).sort();
  }, [combinations, filters.year, filters.event, filters.segment]);

  const availableEvents = useMemo(() => {
    const filtered = combinations.filter(
      (c) =>
        (!filters.year || c.year === Number(filters.year)) &&
        (!filters.name || c.name === filters.name) &&
        (!filters.segment || c.segment === filters.segment)
    );
    const set = new Set(filtered.map((c) => c.event));
    return Array.from(set).sort();
  }, [combinations, filters.year, filters.name, filters.segment]);

  // 区間の選択肢：year + name + event（駅伝系）で絞り込み
  const availableSegments = useMemo(() => {
    const filtered = combinations.filter(
      (c) =>
        (!filters.year || c.year === Number(filters.year)) &&
        (!filters.name || c.name === filters.name) &&
        (!filters.event || c.event === filters.event) &&
        c.segment !== ""
    );
    const set = new Set(filtered.map((c) => c.segment));
    return Array.from(set).sort((a, b) => segmentOrder(a) - segmentOrder(b));
  }, [combinations, filters.year, filters.name, filters.event]);

  // 区間コンボを表示するか（種目が「駅伝」を含む、または区間データがある）
  const showSegment =
    (filters.event && isEkiden(filters.event)) ||
    (!filters.event && availableSegments.length > 0);

  // --- 結果取得 ---
  const load = useCallback(() => {
    if (!filters.name) {
      setRecords([]);
      return;
    }
    setLoading(true);
    const p = new URLSearchParams();
    p.set("name", filters.name);
    if (filters.year) p.set("year", filters.year);
    if (filters.event) p.set("event", filters.event);
    if (filters.segment) p.set("segment", filters.segment);
    fetch(`/api/competitions?${p}`)
      .then((r) => r.json())
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <div className="page-title">大会</div>
      </div>

      <div className="filter-bar">
        {/* 開催年 */}
        <select
          value={filters.year}
          onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
          style={{ flex: "none", minWidth: "100px" }}
        >
          <option value="">全年度</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>

        {/* 大会名 */}
        <select
          value={filters.name}
          onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
          style={{ flex: "none", minWidth: "200px" }}
        >
          <option value="">大会名を選択...</option>
          {availableNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* 種目 */}
        <select
          value={filters.event}
          onChange={(e) => setFilters((p) => ({ ...p, event: e.target.value }))}
          style={{ flex: "none", minWidth: "130px" }}
        >
          <option value="">全種目</option>
          {availableEvents.map((ev) => (
            <option key={ev} value={ev}>{ev}</option>
          ))}
        </select>

        {/* 区間（駅伝のみ表示） */}
        {showSegment && (
          <select
            value={filters.segment}
            onChange={(e) => setFilters((p) => ({ ...p, segment: e.target.value }))}
            style={{ flex: "none", minWidth: "90px" }}
          >
            <option value="">全区間</option>
            {availableSegments.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {!filters.name ? (
          <div style={{ padding: "2rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            大会名を選択してください
          </div>
        ) : loading ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            読み込み中...
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            該当する記録がありません
          </div>
        ) : (
          <table className="data-table">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: showSegment ? "10%" : "14%" }} />
              {showSegment && <col style={{ width: "8%" }} />}
              <col style={{ width: "20%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>日付</th>
                <th>種目</th>
                {showSegment && <th>区間</th>}
                <th>選手名</th>
                <th>所属</th>
                <th>記録</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: "var(--color-text-secondary)" }}>{formatDate(r.date)}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{r.event}</td>
                  {showSegment && (
                    <td style={{ color: "var(--color-text-secondary)" }}>{r.segment || "—"}</td>
                  )}
                  <td>
                    <Link href={`/athletes/${r.athlete.id}`} className="link-text">
                      {r.athlete.nameKanji}
                    </Link>
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{r.team?.name || "—"}</td>
                  <td style={{ fontWeight: 500 }}>{r.timeString}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {records.length > 0 && (
        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          {records.length}件
        </div>
      )}
    </>
  );
}
