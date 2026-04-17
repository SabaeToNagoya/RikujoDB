"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { EVENTS, PREFECTURES } from "@/lib/timeUtils";

interface Athlete {
  id: string;
  nameKanji: string;
  nameFurigana: string;
  dateOfBirth: string | null;
  highSchool: string | null;
  university: string | null;
  teamName: string | null;
  gender: string;
  prefecture: string | null;
  notes: string | null;
  mainEvent: string | null;
  personalBest: { event: string; timeString: string } | null;
}

const EMPTY_FORM = {
  nameKanji: "",
  nameFurigana: "",
  dateOfBirth: "",
  prefecture: "",
  highSchool: "",
  university: "",
  teamName: "",
  gender: "男性",
  notes: "",
};

function formatDOB(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
}

function EventBadge({ event }: { event: string | null }) {
  if (!event) return <span style={{ color: "var(--color-text-tertiary)" }}>—</span>;
  const cls = event === "マラソン" || event === "ハーフマラソン" ? "badge-green"
    : event.includes("1500") || event.includes("800") ? "badge-blue"
    : "badge-orange";
  return <span className={`badge ${cls}`}>{event}</span>;
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: "", event: "", team: "", school: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Athlete | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadAthletes = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.name) p.set("name", filters.name);
    if (filters.event) p.set("event", filters.event);
    if (filters.team) p.set("team", filters.team);
    if (filters.school) p.set("school", filters.school);
    fetch(`/api/athletes?${p}`)
      .then((r) => r.json())
      .then(setAthletes)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { loadAthletes(); }, [loadAthletes]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const openEdit = (a: Athlete) => {
    setEditing(a);
    setForm({
      nameKanji: a.nameKanji,
      nameFurigana: a.nameFurigana,
      dateOfBirth: a.dateOfBirth ? a.dateOfBirth.split("T")[0] : "",
      prefecture: a.prefecture || "",
      highSchool: a.highSchool || "",
      university: a.university || "",
      teamName: a.teamName || "",
      gender: a.gender,
      notes: a.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing ? `/api/athletes/${editing.id}` : "/api/athletes";
    const method = editing ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModalOpen(false);
    loadAthletes();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/athletes/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadAthletes();
  };

  const f = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <>
      <div className="page-header">
        <div className="page-title">選手</div>
        <button className="btn btn-primary" onClick={openAdd}>+ 選手を追加</button>
      </div>

      {/* フィルター */}
      <div className="filter-bar">
        <input
          placeholder="氏名で検索..."
          value={filters.name}
          onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
        />
        <select
          value={filters.event}
          onChange={(e) => setFilters((p) => ({ ...p, event: e.target.value }))}
        >
          <option value="">全種目</option>
          {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <input
          placeholder="所属で絞り込み..."
          value={filters.team}
          onChange={(e) => setFilters((p) => ({ ...p, team: e.target.value }))}
        />
        <input
          placeholder="出身校で絞り込み..."
          value={filters.school}
          onChange={(e) => setFilters((p) => ({ ...p, school: e.target.value }))}
        />
      </div>

      {/* テーブル */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>読み込み中...</div>
        ) : athletes.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            {Object.values(filters).some(Boolean) ? "条件に一致する選手がいません" : "選手が登録されていません"}
          </div>
        ) : (
          <table className="data-table">
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>氏名</th>
                <th>生年月日</th>
                <th>出身高校</th>
                <th>出身大学</th>
                <th>所属</th>
                <th>主種目</th>
                <th>自己ベスト</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Link href={`/athletes/${a.id}`} className="link-text">{a.nameKanji}</Link>
                    </div>
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{formatDOB(a.dateOfBirth)}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{a.highSchool || "—"}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{a.university || "—"}</td>
                  <td>{a.teamName || "—"}</td>
                  <td><EventBadge event={a.mainEvent} /></td>
                  <td style={{ fontWeight: 500 }}>{a.personalBest?.timeString || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
        {athletes.length}人
      </div>

      {/* 選手追加/編集モーダル */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "選手を編集" : "選手を追加"}
      >
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">氏名（漢字）*</label>
              <input className="form-input" value={form.nameKanji} onChange={(e) => f("nameKanji", e.target.value)} placeholder="田中 希実" />
            </div>
            <div>
              <label className="form-label">ふりがな</label>
              <input className="form-input" value={form.nameFurigana} onChange={(e) => f("nameFurigana", e.target.value)} placeholder="たなか のぞみ" />
            </div>
          </div>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">生年月日</label>
              <input className="form-input" type="date" value={form.dateOfBirth} onChange={(e) => f("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <label className="form-label">性別</label>
              <select className="form-select" value={form.gender} onChange={(e) => f("gender", e.target.value)}>
                <option>男性</option>
                <option>女性</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">出身都道府県</label>
            <select className="form-select" value={form.prefecture} onChange={(e) => f("prefecture", e.target.value)}>
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">出身高校</label>
              <input className="form-input" value={form.highSchool} onChange={(e) => f("highSchool", e.target.value)} placeholder="西脇工業" />
            </div>
            <div>
              <label className="form-label">出身大学</label>
              <input className="form-input" value={form.university} onChange={(e) => f("university", e.target.value)} placeholder="早稲田大学" />
            </div>
          </div>
          <div>
            <label className="form-label">所属チーム</label>
            <input className="form-input" value={form.teamName} onChange={(e) => f("teamName", e.target.value)} placeholder="富士通" />
          </div>
          <div>
            <label className="form-label">備考</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => f("notes", e.target.value)} placeholder="メモ..." style={{ resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            {editing && (
              <button className="btn btn-danger" onClick={() => { setModalOpen(false); setDeleteId(editing.id); }}>削除</button>
            )}
            <button className="btn" onClick={() => setModalOpen(false)}>キャンセル</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nameKanji}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 削除確認 */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="選手を削除">
        <p style={{ fontSize: "13px", marginBottom: "1rem" }}>この選手とすべての記録を削除します。元に戻せません。</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setDeleteId(null)}>キャンセル</button>
          <button className="btn btn-danger" onClick={handleDelete}>削除する</button>
        </div>
      </Modal>
    </>
  );
}
