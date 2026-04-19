"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { EVENTS, PREFECTURES } from "@/lib/timeUtils";

interface AthleteRecord {
  id: string;
  event: string;
  segment: string | null;
  timeString: string;
  competitionName: string;
  date: string;
  notes: string | null;
  team?: { name: string } | null;
}
interface Connection {
  type: "同期" | "先輩" | "後輩";
  school: string;
  schoolType: "高校" | "大学";
  athlete: { id: string; nameKanji: string; dateOfBirth: string | null };
}
interface AthleteDetail {
  id: string;
  nameKanji: string;
  nameFurigana: string;
  dateOfBirth: string | null;
  prefecture: string | null;
  highSchool: string | null;
  university: string | null;
  teamId: string | null;
  team: { id: string; name: string } | null;
  gender: string;
  notes: string | null;
  records: AthleteRecord[];
  bestByEvent: Record<string, { timeString: string; timeSeconds: number; competitionName: string; date: string }>;
  seasonBestByEvent: Record<string, { timeString: string }>;
  connections: Connection[];
}

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
}

function formatDOB(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日生`;
}

const connBadge: Record<string, string> = {
  同期: "badge-purple",
  先輩: "badge-green",
  後輩: "badge-orange",
};

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const EMPTY_RECORD_FORM = {
  event: "マラソン",
  timeString: "",
  competitionName: "",
  date: "",
  teamId: "",
  segment: "",
  notes: "",
};

const EMPTY_ATHLETE_FORM = {
  nameKanji: "",
  nameFurigana: "",
  dateOfBirth: "",
  prefecture: "",
  highSchool: "",
  university: "",
  teamId: "",
  gender: "男性",
  notes: "",
};

export default function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [athlete, setAthlete] = useState<AthleteDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"recent" | "all" | "connections">("recent");
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [recordModal, setRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AthleteRecord | null>(null);
  const [recordForm, setRecordForm] = useState(EMPTY_RECORD_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [athleteModal, setAthleteModal] = useState(false);
  const [athleteForm, setAthleteForm] = useState(EMPTY_ATHLETE_FORM);
  const [athleteSaving, setAthleteSaving] = useState(false);
  const [deleteAthleteConfirm, setDeleteAthleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/athletes/${id}`).then((r) => r.json()).then(setAthlete);
    fetch("/api/teams")
      .then((r) => r.json())
      .then((t: { id: string; name: string }[]) =>
        setTeams(t.map((tm) => ({ id: tm.id, name: tm.name })))
      );
  }, [id]);

  const reload = () =>
    fetch(`/api/athletes/${id}`).then((r) => r.json()).then(setAthlete);

  const openEditAthlete = () => {
    if (!athlete) return;
    setAthleteForm({
      nameKanji: athlete.nameKanji,
      nameFurigana: athlete.nameFurigana,
      dateOfBirth: athlete.dateOfBirth ? athlete.dateOfBirth.split("T")[0] : "",
      prefecture: athlete.prefecture || "",
      highSchool: athlete.highSchool || "",
      university: athlete.university || "",
      teamId: athlete.teamId || "",
      gender: athlete.gender,
      notes: athlete.notes || "",
    });
    setAthleteModal(true);
  };

  const saveAthlete = async () => {
    setAthleteSaving(true);
    await fetch(`/api/athletes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(athleteForm),
    });
    setAthleteSaving(false);
    setAthleteModal(false);
    reload();
  };

  const deleteAthlete = async () => {
    await fetch(`/api/athletes/${id}`, { method: "DELETE" });
    router.push("/athletes");
  };

  const af = (k: string, v: string) =>
    setAthleteForm((p) => ({ ...p, [k]: v }));

  const openAddRecord = () => {
    setEditingRecord(null);
    setRecordForm(EMPTY_RECORD_FORM);
    setRecordModal(true);
  };
  const openEditRecord = (r: AthleteRecord) => {
    setEditingRecord(r);
    setRecordForm({
      event: r.event,
      timeString: r.timeString,
      competitionName: r.competitionName,
      date: r.date.split("T")[0],
      teamId: "",
      segment: r.segment || "",
      notes: r.notes || "",
    });
    setRecordModal(true);
  };

  const saveRecord = async () => {
    setSaving(true);
    const url = editingRecord ? `/api/records/${editingRecord.id}` : "/api/records";
    const method = editingRecord ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...recordForm, athleteId: id }),
    });
    setSaving(false);
    setRecordModal(false);
    reload();
  };

  const deleteRecord = async () => {
    if (!deleteRecordId) return;
    await fetch(`/api/records/${deleteRecordId}`, { method: "DELETE" });
    setDeleteRecordId(null);
    reload();
  };

  const rf = (k: string, v: string) =>
    setRecordForm((p) => ({ ...p, [k]: v }));

  if (!athlete) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
        読み込み中...
      </div>
    );
  }

  const recentRecords = athlete.records.filter(
    (r) => new Date(r.date) >= oneYearAgo
  );
  const bestEvents = Object.entries(athlete.bestByEvent);
  const topEvents = bestEvents.slice(0, 3);

  // つながりをグループ化
  const connGroups: Record<string, Connection[]> = {};
  athlete.connections.forEach((c) => {
    const key = `${c.schoolType}: ${c.school}`;
    if (!connGroups[key]) connGroups[key] = [];
    connGroups[key].push(c);
  });

  return (
    <>
      {/* パンくず */}
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => router.push("/athletes")}>
          選手
        </button>
        <span className="breadcrumb-sep">›</span>
        <span style={{ color: "var(--color-text-primary)" }}>{athlete.nameKanji}</span>
      </div>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "0.9rem" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 500, color: "#0F6E56", flexShrink: 0 }}>
          {athlete.nameKanji[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: 500 }}>{athlete.nameKanji}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px", lineHeight: 1.6 }}>
            {[
              formatDOB(athlete.dateOfBirth),
              athlete.prefecture,
              [athlete.highSchool, athlete.university].filter(Boolean).join(" → "),
              athlete.team?.name,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {athlete.notes && (
            <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "3px" }}>
              {athlete.notes}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="btn btn-primary" onClick={openAddRecord}>
            + 記録を追加
          </button>
          <button className="btn" onClick={openEditAthlete}>
            ✏️ 編集
          </button>
          <button className="btn" onClick={() => router.push("/athletes")}>
            一覧へ
          </button>
        </div>
      </div>

      {/* 自己ベストカード */}
      {topEvents.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(topEvents.length, 3)}, 1fr)`,
            gap: "8px",
            marginBottom: "0.9rem",
          }}
        >
          {topEvents.map(([ev, best]) => (
            <div key={ev} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.6rem 0.8rem" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "2px" }}>
                {ev} 自己ベスト
              </div>
              <div style={{ fontSize: "16px", fontWeight: 500 }}>{best.timeString}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "1px" }}>
                {best.competitionName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* タブ */}
      <div className="card" style={{ padding: "0.9rem 1.1rem" }}>
        <div className="tab-bar">
          <button
            className={`tab-item ${activeTab === "recent" ? "active" : ""}`}
            onClick={() => setActiveTab("recent")}
          >
            直近1年の記録
          </button>
          <button
            className={`tab-item ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            全記録
          </button>
          <button
            className={`tab-item ${activeTab === "connections" ? "active" : ""}`}
            onClick={() => setActiveTab("connections")}
          >
            つながり
          </button>
        </div>

        {/* 直近1年 */}
        {activeTab === "recent" && (
          <>
            <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "0.4rem" }}>
              過去1年間の記録
            </div>
            {recentRecords.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>
                直近1年の記録がありません
              </div>
            ) : (
              <RecordTable
                records={recentRecords}
                onEdit={openEditRecord}
                onDelete={setDeleteRecordId}
              />
            )}
          </>
        )}

        {/* 全記録 */}
        {activeTab === "all" && (
          <>
            {athlete.records.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>
                記録がありません
              </div>
            ) : (
              <RecordTable
                records={athlete.records}
                onEdit={openEditRecord}
                onDelete={setDeleteRecordId}
              />
            )}
          </>
        )}

        {/* つながり */}
        {activeTab === "connections" && (
          <>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
              出身校ベースで自動算出（生年から推定）
            </div>
            {Object.keys(connGroups).length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>
                つながりが見つかりません
              </div>
            ) : (
              Object.entries(connGroups).map(([groupLabel, conns]) => (
                <div key={groupLabel} style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: "0.3rem" }}>
                    {groupLabel}
                  </div>
                  {conns.map((c, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: "7px", padding: "5px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}
                    >
                      <span
                        className={`badge ${connBadge[c.type] || "badge-blue"}`}
                        style={{ minWidth: "36px", textAlign: "center" }}
                      >
                        {c.type}
                      </span>
                      <button
                        onClick={() => router.push(`/athletes/${c.athlete.id}`)}
                        className="link-text"
                        style={{ fontSize: "11px", flex: 1, textAlign: "left", background: "none", border: "none" }}
                      >
                        {c.athlete.nameKanji}
                      </button>
                      <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                        {c.athlete.dateOfBirth
                          ? new Date(c.athlete.dateOfBirth).getFullYear() + "年生"
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* 記録追加/編集モーダル */}
      <Modal
        isOpen={recordModal}
        onClose={() => setRecordModal(false)}
        title={editingRecord ? "記録を編集" : "記録を追加"}
      >
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">種目*</label>
              <select
                className="form-select"
                value={recordForm.event}
                onChange={(e) => rf("event", e.target.value)}
              >
                {EVENTS.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">記録（タイム）*</label>
              <input
                className="form-input"
                value={recordForm.timeString}
                onChange={(e) => rf("timeString", e.target.value)}
                placeholder="2:06:35 または 13:24.75"
              />
            </div>
          </div>
          <div>
            <label className="form-label">大会名*</label>
            <input
              className="form-input"
              value={recordForm.competitionName}
              onChange={(e) => rf("competitionName", e.target.value)}
              placeholder="東京マラソン 2024"
            />
          </div>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">開催日*</label>
              <input
                className="form-input"
                type="date"
                value={recordForm.date}
                onChange={(e) => rf("date", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">区間（駅伝のみ）</label>
              <input
                className="form-input"
                value={recordForm.segment}
                onChange={(e) => rf("segment", e.target.value)}
                placeholder="1区 / 2区"
              />
            </div>
          </div>
          <div>
            <label className="form-label">当時の所属チーム（任意）</label>
            <select
              className="form-select"
              value={recordForm.teamId}
              onChange={(e) => rf("teamId", e.target.value)}
            >
              <option value="">—（未設定）</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">備考（任意）</label>
            <input
              className="form-input"
              value={recordForm.notes}
              onChange={(e) => rf("notes", e.target.value)}
              placeholder="自己ベスト / 区間新 等"
            />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            {editingRecord && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  setRecordModal(false);
                  setDeleteRecordId(editingRecord.id);
                }}
              >
                削除
              </button>
            )}
            <button className="btn" onClick={() => setRecordModal(false)}>
              キャンセル
            </button>
            <button
              className="btn btn-primary"
              onClick={saveRecord}
              disabled={
                saving ||
                !recordForm.timeString ||
                !recordForm.competitionName ||
                !recordForm.date
              }
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 記録削除確認 */}
      <Modal
        isOpen={!!deleteRecordId}
        onClose={() => setDeleteRecordId(null)}
        title="記録を削除"
      >
        <p style={{ fontSize: "13px", marginBottom: "1rem" }}>
          この記録を削除します。元に戻せません。
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setDeleteRecordId(null)}>
            キャンセル
          </button>
          <button className="btn btn-danger" onClick={deleteRecord}>
            削除する
          </button>
        </div>
      </Modal>

      {/* 選手情報編集モーダル */}
      <Modal
        isOpen={athleteModal}
        onClose={() => setAthleteModal(false)}
        title="選手情報を編集"
      >
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">氏名（漢字）*</label>
              <input
                className="form-input"
                value={athleteForm.nameKanji}
                onChange={(e) => af("nameKanji", e.target.value)}
                placeholder="田中 希実"
              />
            </div>
            <div>
              <label className="form-label">ふりがな</label>
              <input
                className="form-input"
                value={athleteForm.nameFurigana}
                onChange={(e) => af("nameFurigana", e.target.value)}
                placeholder="たなか のぞみ"
              />
            </div>
          </div>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">生年月日</label>
              <input
                className="form-input"
                type="date"
                value={athleteForm.dateOfBirth}
                onChange={(e) => af("dateOfBirth", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">性別</label>
              <select
                className="form-select"
                value={athleteForm.gender}
                onChange={(e) => af("gender", e.target.value)}
              >
                <option>男性</option>
                <option>女性</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">出身都道府県</label>
            <select
              className="form-select"
              value={athleteForm.prefecture}
              onChange={(e) => af("prefecture", e.target.value)}
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="two-col" style={{ gap: "8px" }}>
            <div>
              <label className="form-label">出身高校</label>
              <input
                className="form-input"
                value={athleteForm.highSchool}
                onChange={(e) => af("highSchool", e.target.value)}
                placeholder="西脇工業"
              />
            </div>
            <div>
              <label className="form-label">出身大学</label>
              <input
                className="form-input"
                value={athleteForm.university}
                onChange={(e) => af("university", e.target.value)}
                placeholder="早稲田大学"
              />
            </div>
          </div>
          <div>
            <label className="form-label">所属チーム</label>
            <select
              className="form-select"
              value={athleteForm.teamId}
              onChange={(e) => af("teamId", e.target.value)}
            >
              <option value="">未設定</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">備考</label>
            <textarea
              className="form-input"
              rows={2}
              value={athleteForm.notes}
              onChange={(e) => af("notes", e.target.value)}
              placeholder="メモ..."
              style={{ resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button
              className="btn btn-danger"
              onClick={() => { setAthleteModal(false); setDeleteAthleteConfirm(true); }}
            >
              選手を削除
            </button>
            <button className="btn" onClick={() => setAthleteModal(false)}>
              キャンセル
            </button>
            <button
              className="btn btn-primary"
              onClick={saveAthlete}
              disabled={athleteSaving || !athleteForm.nameKanji}
            >
              {athleteSaving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>

      {/* 選手削除確認 */}
      <Modal
        isOpen={deleteAthleteConfirm}
        onClose={() => setDeleteAthleteConfirm(false)}
        title="選手を削除"
      >
        <p style={{ fontSize: "13px", marginBottom: "1rem" }}>
          この選手とすべての記録を削除します。元に戻せません。
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setDeleteAthleteConfirm(false)}>
            キャンセル
          </button>
          <button className="btn btn-danger" onClick={deleteAthlete}>
            削除する
          </button>
        </div>
      </Modal>
    </>
  );
}

function RecordTable({
  records,
  onEdit,
  onDelete,
}: {
  records: AthleteRecord[];
  onEdit: (r: AthleteRecord) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <table className="data-table">
      <colgroup>
        <col style={{ width: "28%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "24%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>大会名</th>
          <th>日付</th>
          <th>種目</th>
          <th>記録</th>
          <th>区間</th>
          <th>メモ</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr
            key={r.id}
            style={{ cursor: "pointer" }}
            onClick={() => onEdit(r)}
          >
            <td>{r.competitionName}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>
              {formatDate(r.date)}
            </td>
            <td>{r.event}</td>
            <td style={{ fontWeight: 500 }}>{r.timeString}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>
              {r.segment || "—"}
            </td>
            <td style={{ color: "var(--color-text-tertiary)" }}>
              {r.notes || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
