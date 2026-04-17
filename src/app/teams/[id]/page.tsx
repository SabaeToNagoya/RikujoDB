"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

interface TeamAthlete {
  id: string;
  nameKanji: string;
  teamName: string | null;
  mainEvent: string | null;
  bestByEvent: Record<string, string>;
}
interface TeamResult {
  id: string;
  competitionName: string;
  type: string;
  year: number;
  ranking: number;
  totalTime: string | null;
  notes: string | null;
}
interface TeamDetail {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  results: TeamResult[];
  athletes: TeamAthlete[];
}

const RESULT_TYPES = ["駅伝", "マラソン団体戦", "実業団対抗", "その他"];
const EMPTY_RESULT = { competitionName: "", type: "駅伝", year: new Date().getFullYear().toString(), ranking: "", totalTime: "", notes: "" };

function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1 ? "rank-badge rank-1" : rank === 2 ? "rank-badge rank-2" : rank === 3 ? "rank-badge rank-3" : "rank-badge rank-n";
  return <span className={cls}>{rank}</span>;
}

function RankHistChart({ results, compType }: { results: TeamResult[]; compType: string }) {
  const filtered = results.filter((r) => r.type === compType).sort((a, b) => a.year - b.year).slice(-6);
  if (filtered.length === 0) return null;
  const maxRank = Math.max(...filtered.map((r) => r.ranking), 10);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", padding: "0.55rem 0" }}>
      {filtered.map((r) => {
        const heightPct = Math.max(10, 100 - ((r.ranking - 1) / (maxRank - 1)) * 90);
        return (
          <div key={r.year} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", flex: 1 }}>
            <div style={{ height: "48px", display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div style={{ width: "100%", background: "#9FE1CB", borderRadius: "2px 2px 0 0", height: `${heightPct}%`, minHeight: "3px" }} />
            </div>
            <div style={{ fontSize: "10px", fontWeight: 500, color: "#0F6E56" }}>{r.ranking}位</div>
            <div style={{ fontSize: "9px", color: "var(--color-text-tertiary)" }}>{r.year}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"athletes" | "ekiden" | "marathon">("athletes");
  const [resultModal, setResultModal] = useState(false);
  const [editingResult, setEditingResult] = useState<TeamResult | null>(null);
  const [resultForm, setResultForm] = useState(EMPTY_RESULT);
  const [saving, setSaving] = useState(false);

  const reload = () => fetch(`/api/teams/${id}`).then((r) => r.json()).then(setTeam);
  useEffect(() => { reload(); }, [id]);

  const openAddResult = () => { setEditingResult(null); setResultForm(EMPTY_RESULT); setResultModal(true); };
  const openEditResult = (r: TeamResult) => {
    setEditingResult(r);
    setResultForm({ competitionName: r.competitionName, type: r.type, year: r.year.toString(), ranking: r.ranking.toString(), totalTime: r.totalTime || "", notes: r.notes || "" });
    setResultModal(true);
  };

  const saveResult = async () => {
    setSaving(true);
    const url = editingResult ? `/api/teams/${id}/results/${editingResult.id}` : `/api/teams/${id}/results`;
    // TeamResultsのAPIがない場合は直接POSTで実装
    const body = { teamId: id, competitionName: resultForm.competitionName, type: resultForm.type, year: parseInt(resultForm.year), ranking: parseInt(resultForm.ranking), totalTime: resultForm.totalTime || null, notes: resultForm.notes || null };
    if (editingResult) {
      await fetch(`/api/team-results/${editingResult.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/team-results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setSaving(false);
    setResultModal(false);
    reload();
  };

  const rf = (k: string, v: string) => setResultForm((p) => ({ ...p, [k]: v }));

  if (!team) return <div style={{ padding: "2rem", textAlign: "center", fontSize: "12px", color: "var(--color-text-tertiary)" }}>読み込み中...</div>;

  const ekidenResults = team.results.filter((r) => r.type === "駅伝").sort((a, b) => b.year - a.year);
  const marathonResults = team.results.filter((r) => r.type !== "駅伝").sort((a, b) => b.year - a.year);
  const typeBadge = team.type === "実業団" ? "badge-green" : team.type === "大学" ? "badge-purple" : "badge-orange";

  return (
    <>
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => router.push("/teams")}>チーム</button>
        <span className="breadcrumb-sep">›</span>
        <span style={{ color: "var(--color-text-primary)" }}>{team.name}</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "0.9rem" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "8px", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 500, color: "#0F6E56", flexShrink: 0 }}>
          {team.name.slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: 500 }}>{team.name}</div>
          <div style={{ marginTop: "4px" }}>
            <span className={`badge ${typeBadge}`}>{team.type}</span>
          </div>
          {team.notes && <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>{team.notes}</div>}
        </div>
        <button className="btn btn-primary" onClick={openAddResult}>+ 成績を追加</button>
      </div>

      {/* 成績サマリー */}
      {team.results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "0.9rem" }}>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.6rem 0.8rem" }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "2px" }}>優勝回数</div>
            <div style={{ fontSize: "18px", fontWeight: 500 }}>{team.results.filter((r) => r.ranking === 1).length}回</div>
          </div>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.6rem 0.8rem" }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "2px" }}>登録成績数</div>
            <div style={{ fontSize: "18px", fontWeight: 500 }}>{team.results.length}件</div>
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="card">
        <div className="tab-bar">
          <button className={`tab-item ${activeTab === "athletes" ? "active" : ""}`} onClick={() => setActiveTab("athletes")}>所属選手</button>
          <button className={`tab-item ${activeTab === "ekiden" ? "active" : ""}`} onClick={() => setActiveTab("ekiden")}>駅伝成績</button>
          <button className={`tab-item ${activeTab === "marathon" ? "active" : ""}`} onClick={() => setActiveTab("marathon")}>その他成績</button>
        </div>

        {activeTab === "athletes" && (
          team.athletes.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>
              このチームに紐づく選手の記録がありません（記録登録時にチームを設定してください）
            </div>
          ) : (
            <table className="data-table">
              <colgroup>
                <col style={{ width: "28%" }} /><col style={{ width: "16%" }} /><col style={{ width: "56%" }} />
              </colgroup>
              <thead><tr><th>氏名</th><th>主種目</th><th>自己ベスト</th></tr></thead>
              <tbody>
                {team.athletes.map((a) => (
                  <tr key={a.id}>
                    <td><Link href={`/athletes/${a.id}`} className="link-text">{a.nameKanji}</Link></td>
                    <td>{a.mainEvent || "—"}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {Object.entries(a.bestByEvent).slice(0, 3).map(([ev, t]) => `${ev}: ${t}`).join("  /  ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {activeTab === "ekiden" && (
          <>
            {ekidenResults.length > 0 && <RankHistChart results={team.results} compType="駅伝" />}
            {ekidenResults.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>駅伝成績がありません</div>
            ) : (
              <ResultTable results={ekidenResults} onEdit={openEditResult} />
            )}
          </>
        )}

        {activeTab === "marathon" && (
          marathonResults.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>成績がありません</div>
          ) : (
            <ResultTable results={marathonResults} onEdit={openEditResult} />
          )
        )}
      </div>

      {/* 成績モーダル */}
      <Modal isOpen={resultModal} onClose={() => setResultModal(false)} title={editingResult ? "成績を編集" : "成績を追加"}>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div>
            <label className="form-label">大会名*</label>
            <input className="form-input" value={resultForm.competitionName} onChange={(e) => rf("competitionName", e.target.value)} placeholder="箱根駅伝" />
          </div>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">種別*</label>
              <select className="form-select" value={resultForm.type} onChange={(e) => rf("type", e.target.value)}>
                {RESULT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">開催年*</label>
              <input className="form-input" type="number" value={resultForm.year} onChange={(e) => rf("year", e.target.value)} placeholder="2025" />
            </div>
          </div>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">順位*</label>
              <input className="form-input" type="number" value={resultForm.ranking} onChange={(e) => rf("ranking", e.target.value)} placeholder="1" />
            </div>
            <div>
              <label className="form-label">合計タイム</label>
              <input className="form-input" value={resultForm.totalTime} onChange={(e) => rf("totalTime", e.target.value)} placeholder="10:41:19" />
            </div>
          </div>
          <div>
            <label className="form-label">備考</label>
            <input className="form-input" value={resultForm.notes} onChange={(e) => rf("notes", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button className="btn" onClick={() => setResultModal(false)}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveResult} disabled={saving || !resultForm.competitionName || !resultForm.ranking}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ResultTable({ results, onEdit }: { results: TeamResult[]; onEdit: (r: TeamResult) => void }) {
  return (
    <table className="data-table">
      <colgroup>
        <col style={{ width: "36%" }} /><col style={{ width: "12%" }} /><col style={{ width: "10%" }} /><col style={{ width: "20%" }} /><col style={{ width: "22%" }} />
      </colgroup>
      <thead><tr><th>大会名</th><th>年</th><th>順位</th><th>合計タイム</th><th>備考</th></tr></thead>
      <tbody>
        {results.map((r) => (
          <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => onEdit(r)}>
            <td>{r.competitionName}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{r.year}</td>
            <td><span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><RankBadge rank={r.ranking} /></span></td>
            <td style={{ fontWeight: r.totalTime ? 500 : undefined, color: r.totalTime ? undefined : "var(--color-text-tertiary)" }}>{r.totalTime || "—"}</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>{r.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1 ? "rank-badge rank-1" : rank === 2 ? "rank-badge rank-2" : rank === 3 ? "rank-badge rank-3" : "rank-badge rank-n";
  return <span className={cls}>{rank}</span>;
}
