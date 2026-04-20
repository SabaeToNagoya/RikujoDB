"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";

interface Team {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  records: { athleteId: string }[];
}

const TEAM_TYPES = ["実業団", "大学", "高校", "その他"];
const typeBadge = (t: string) =>
  t === "実業団" ? "badge-green" : t === "大学" ? "badge-purple" : t === "高校" ? "badge-orange" : "badge-blue";

const EMPTY_FORM = { name: "", type: "実業団", notes: "" };

type Filters = { name: string; type: string };
const EMPTY_FILTERS: Filters = { name: "", type: "" };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  // 入力欄の値（表示用）
  const [inputFilters, setInputFilters] = useState<Filters>(EMPTY_FILTERS);
  // 実際にAPIに送る値（nullの間はAPI呼び出しなし）
  const [searchFilters, setSearchFilters] = useState<Filters | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadTeams = useCallback(() => {
    if (searchFilters === null) return;
    setLoading(true);
    const p = new URLSearchParams();
    if (searchFilters.name) p.set("name", searchFilters.name);
    if (searchFilters.type) p.set("type", searchFilters.type);
    fetch(`/api/teams?${p}`)
      .then((r) => r.json())
      .then(setTeams)
      .finally(() => setLoading(false));
  }, [searchFilters]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  // 検索実行（ボタンまたはEnterキー）
  const handleSearch = () => {
    setSearchFilters({ ...inputFilters });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

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

  return (
    <>
      <div className="page-header">
        <div className="page-title">チーム</div>
        <button className="btn btn-primary" onClick={openAdd}>+ チームを追加</button>
      </div>

      <div className="filter-bar">
        <input
          placeholder="チーム名で検索..."
          value={inputFilters.name}
          onChange={(e) => setInputFilters((p) => ({ ...p, name: e.target.value }))}
          onKeyDown={handleKeyDown}
        />
        <select
          value={inputFilters.type}
          onChange={(e) => setInputFilters((p) => ({ ...p, type: e.target.value }))}
        >
          <option value="">全種別</option>
          {TEAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleSearch}>検索</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>読み込み中...</div>
        ) : searchFilters === null ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            検索条件を入力し、Enterキーまたは検索ボタンで検索してください
          </div>
        ) : teams.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            条件に一致するチームがありません
          </div>
        ) : (
          <table className="data-table">
            <colgroup>
              <col style={{ width: "46%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>チーム名</th>
                <th>種別</th>
                <th>記録数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/teams/${t.id}`} className="link-text">{t.name}</Link>
                  </td>
                  <td><span className={`badge ${typeBadge(t.type)}`}>{t.type}</span></td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {t.records.length}件
                  </td>
                  <td>
                    <button className="btn" style={{ fontSize: "10px", padding: "2px 7px" }} onClick={() => openEdit(t)}>編集</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {searchFilters !== null && (
        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{teams.length}チーム</div>
      )}

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
