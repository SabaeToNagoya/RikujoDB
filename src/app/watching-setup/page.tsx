"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EVENTS } from "@/lib/timeUtils";

interface Athlete {
  id: string;
  nameKanji: string;
  teamName: string | null;
  mainEvent: string | null;
  personalBest: { event: string; timeString: string } | null;
}
interface Team {
  id: string;
  name: string;
  type: string;
  results: { year: number; ranking: number; type: string }[];
}
interface SegmentAssignment {
  segmentNo: number;
  athleteId: string | null;
}
interface TeamSetupItem {
  teamId: string;
  teamName: string;
  segments: SegmentAssignment[];
}

const NUM_SEGMENTS = 10;

export default function WatchingSetupPage() {
  const router = useRouter();
  const [raceType, setRaceType] = useState<"individual" | "ekiden">("ekiden");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [athleteSearch, setAthleteSearch] = useState("");
  const [athleteEventFilter, setAthleteEventFilter] = useState("");
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [teamSetup, setTeamSetup] = useState<TeamSetupItem[]>([]);
  const [segmentCount, setSegmentCount] = useState(5);
  const [setupName, setSetupName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/athletes").then((r) => r.json()).then(setAthletes);
    fetch("/api/teams").then((r) => r.json()).then(setTeams);
  }, []);

  // チーム選択変更時にteamSetupを更新
  useEffect(() => {
    setTeamSetup((prev) => {
      const newSetup: TeamSetupItem[] = [];
      selectedTeamIds.forEach((tid) => {
        const team = teams.find((t) => t.id === tid);
        if (!team) return;
        const existing = prev.find((p) => p.teamId === tid);
        newSetup.push({
          teamId: tid,
          teamName: team.name,
          segments: Array.from({ length: segmentCount }, (_, i) => ({
            segmentNo: i + 1,
            athleteId: existing?.segments[i]?.athleteId || null,
          })),
        });
      });
      return newSetup;
    });
  }, [selectedTeamIds, teams, segmentCount]);

  const toggleAthlete = (id: string) => {
    setSelectedAthleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setSegmentAthlete = (teamId: string, segNo: number, athleteId: string) => {
    setTeamSetup((prev) =>
      prev.map((ts) =>
        ts.teamId === teamId
          ? { ...ts, segments: ts.segments.map((s) => s.segmentNo === segNo ? { ...s, athleteId: athleteId || null } : s) }
          : ts
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const name = setupName || (raceType === "individual" ? `個人レース (${selectedAthleteIds.size}名)` : `駅伝 (${selectedTeamIds.size}チーム)`);
    const body = {
      name,
      type: raceType,
      athleteIds: Array.from(selectedAthleteIds),
      teamSetup: raceType === "ekiden" ? teamSetup : null,
    };
    const res = await fetch("/api/watching-setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setSaving(false);
    router.push(`/watching?setupId=${saved.id}`);
  };

  const filteredAthletes = athletes.filter((a) => {
    const nameMatch = !athleteSearch || a.nameKanji.includes(athleteSearch);
    const eventMatch = !athleteEventFilter || a.mainEvent === athleteEventFilter;
    return nameMatch && eventMatch;
  });

  const getTeamLatestEkiden = (team: Team) => {
    const e = team.results.filter((r) => r.type === "駅伝").sort((a, b) => b.year - a.year)[0];
    return e ? `箱根${e.year}: ${e.ranking}位` : null;
  };

  return (
    <>
      <div className="page-header"><div className="page-title">観戦セットアップ</div></div>

      {/* セットアップ名 */}
      <div style={{ marginBottom: "0.9rem" }}>
        <label className="form-label">セットアップ名（任意）</label>
        <input className="form-input" value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="例: 箱根駅伝2025" style={{ maxWidth: "320px" }} />
      </div>

      {/* ステップ1: 種別 */}
      <div className="card">
        <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "0.65rem" }}>ステップ 1 — レース種別を選択</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {(["individual", "ekiden"] as const).map((t) => (
            <div
              key={t}
              onClick={() => setRaceType(t)}
              style={{
                border: raceType === t ? "2px solid #1D9E75" : "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-lg)",
                padding: "0.9rem",
                textAlign: "center",
                cursor: "pointer",
                background: raceType === t ? "#E1F5EE" : "var(--color-background-primary)",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 500 }}>{t === "individual" ? "トラック / マラソン" : "駅伝"}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginTop: "3px" }}>
                {t === "individual" ? "個人レース。出場選手をDBから選択" : "チームレース。出場チームをDBから選択"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ステップ2: 選手/チーム選択 */}
      {raceType === "individual" ? (
        <div className="card">
          <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "0.65rem" }}>ステップ 2 — 出場選手を選択</div>
          <div className="filter-bar" style={{ marginBottom: "0.65rem" }}>
            <input placeholder="選手名で絞り込み..." value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} />
            <select value={athleteEventFilter} onChange={(e) => setAthleteEventFilter(e.target.value)}>
              <option value="">全種目</option>
              {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
            </select>
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "0.4rem" }}>
            {selectedAthleteIds.size}名選択中
          </div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {filteredAthletes.map((a) => (
              <div
                key={a.id}
                className={`check-row ${selectedAthleteIds.has(a.id) ? "selected" : ""}`}
                onClick={() => toggleAthlete(a.id)}
              >
                <div className={`check-box ${selectedAthleteIds.has(a.id) ? "checked" : ""}`}>✓</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>{a.nameKanji}</span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginLeft: "6px" }}>
                    {[a.teamName, a.mainEvent && `${a.mainEvent} PB: ${a.personalBest?.timeString}`].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "0.65rem" }}>ステップ 2 — 出場チームを選択</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "0.65rem" }}>
              {selectedTeamIds.size}チーム選択中
            </div>
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`check-row ${selectedTeamIds.has(t.id) ? "selected" : ""}`}
                  onClick={() => toggleTeam(t.id)}
                >
                  <div className={`check-box ${selectedTeamIds.has(t.id) ? "checked" : ""}`}>✓</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "11px", fontWeight: 500 }}>{t.name}</span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginLeft: "6px" }}>
                      {[t.type, getTeamLatestEkiden(t)].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ステップ3: 区間割り当て */}
          {selectedTeamIds.size > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                <div style={{ fontSize: "12px", fontWeight: 500 }}>ステップ 3 — 区間選手を割り当て（任意）</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>区間数:</span>
                  <select className="form-select" value={segmentCount} onChange={(e) => setSegmentCount(parseInt(e.target.value))} style={{ width: "60px", padding: "3px 4px", fontSize: "11px" }}>
                    {Array.from({ length: NUM_SEGMENTS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {teamSetup.map((ts) => (
                <div key={ts.teamId} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: "0.35rem" }}>{ts.teamName}</div>
                  <table className="data-table">
                    <colgroup><col style={{ width: "12%" }} /><col style={{ width: "40%" }} /><col style={{ width: "48%" }} /></colgroup>
                    <thead><tr><th>区間</th><th>選手</th><th>参考記録</th></tr></thead>
                    <tbody>
                      {ts.segments.map((seg) => {
                        const assigned = athletes.find((a) => a.id === seg.athleteId);
                        return (
                          <tr key={seg.segmentNo}>
                            <td style={{ color: "var(--color-text-secondary)" }}>{seg.segmentNo}区</td>
                            <td>
                              <select
                                className="form-select"
                                value={seg.athleteId || ""}
                                onChange={(e) => setSegmentAthlete(ts.teamId, seg.segmentNo, e.target.value)}
                                style={{ fontSize: "11px", padding: "3px 4px" }}
                              >
                                <option value="">— 未割り当て</option>
                                {athletes.map((a) => <option key={a.id} value={a.id}>{a.nameKanji}</option>)}
                              </select>
                            </td>
                            <td style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
                              {assigned?.personalBest ? `${assigned.personalBest.event} ${assigned.personalBest.timeString}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 観戦モードへボタン */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || (raceType === "individual" ? selectedAthleteIds.size === 0 : selectedTeamIds.size === 0)}
        >
          {saving ? "保存中..." : "観戦モードへ →"}
        </button>
      </div>
    </>
  );
}
