"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";

interface Team {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  results: { year: number; competitionName: string; ranking: number; type: string }[];
  records: { athleteId: string }[];
}

const TEAM_TYPES = ["実業団", "大学", "高校", "その他"];
const typeBadge = (t: string) =>
  t === "実業団" ? "badge-green" : t === "大学" ? "badge-purple" : t === "高校" ? "badge-orange" : "badge-blue";

const EMPTY_FORM = { name: "", type: "実業団", notes: "" };

function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1 ? "rank-badge rank-1" : rank === 2 ? "rank-badge rank-2" : rank === 3 ? "rank-badge rank-3" : "rank-badge rank-n";
  return <span className={cls}>{rank}</span>;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: "", type: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadTeams = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.name) p.set("name", filters.name);
    if (filters.type) p.set("type", filters.type);
    fetch(`/api/teams?${p}`)
      .then((r) => r.json())
      .then(setTeams)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (t: Team) => {
    setEditing(t);
    setForm({ name: t.name, type: t.type, notes: t.notes || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing ? `/api/teams/${editing.id}` : "/api/teams";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setModalOpen(false);
    loadTeams();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/teams/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadTeams();
  };

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const getLatestResult = (team: Team, compType?: string) => {
    const filtered = compType ? team.results.filter((r) => r.type.includes(compType)) : team.results;
    return filtered.sort((a, b) => b.year - a.year)[0] || null;
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">チーム</div>
        <button className="btn btn-primary" onClick={openAdd}>+ チームを追加</button>
      </div>

      <div className="filter-bar">
        <input
          placeholder="チーム名で検索..."
          value={filters.name}
          onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
        />
        <select value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
          <option value="">全種別</option>
          {TEAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>読み込み中...</div>
        ) : teams.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            {filters.name || filters.type ? "条件に一致するチームがありません" : "チームが登録されていません"}
          </div>
        ) : (
          <table className="data-table">
            <colgroup>
              <col style={{ width: "32%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>チーム名</th>
                <th>種別</th>
                <th>直近駅伝</th>
                <th>直近実業団</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                const ekiden = getLatestResult(t, "駅伝");
                const corporate = getLatestResult(t, "マラソン");
                return (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/teams/${t.id}`} className="link-text">{t.name}</Link>
                    </td>
                    <td><span className={`badge ${typeBadge(t.type)}`}>{t.type}</span></td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {ekiden ? <><RankBadge rank={ekiden.ranking} /> {ekiden.year}年</> : "—"}
                    </td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {corporate ? <><RankBadge rank={corporate.ranking} /> {corporate.year}年</> : "—"}
                    </td>
                    <td>
                      <button className="btn" style={{ fontSize: "10px", padding: "2px 7px" }} onClick={() => openEdit(t)}>編集</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{teams.length}チーム</div>

      {/* モーダル */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "チームを編集" : "チームを追加"}>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div>
            <label className="form-label">チーム名*</label>
            <input className="form-input" value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="青山学院大学" />
          </div>
          <div>
            <label className="form-label">種別*</label>
            <select className="form-select" value={form.type} onChange={(e) => f("type", e.target.value)}>
              {TEAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">備考</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => f("notes", e.target.value)} style={{ resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            {editing && (
              <button className="btn btn-danger" onClick={() => { setModalOpen(false); setDeleteId(editing.id); }}>削除</button>
            )}
            <button className="btn" onClick={() => setModalOpen(false)}>キャンセル</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="チームを削除">
        <p style={{ fontSize: "13px", marginBottom: "1rem" }}>このチームを削除します。関連する記録のチーム紐づけは解除されます。</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setDeleteId(null)}>キャンセル</button>
          <button className="btn btn-danger" onClick={handleDelete}>削除する</button>
        </div>
      </Modal>
    </>
  );
}
