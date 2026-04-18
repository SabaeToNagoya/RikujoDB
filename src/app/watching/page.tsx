"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface AthleteInfo {
  id: string;
  nameKanji: string;
  team: { id: string; name: string } | null;
  personalBest: { event: string; timeString: string } | null;
  recentRecords: { event: string; timeString: string; date: string; competitionName: string }[];
}
interface TeamInfo {
  id: string;
  name: string;
  segments: { segmentNo: number; athlete: AthleteInfo | null }[];
}
interface WatchingSetupData {
  id: string;
  name: string;
  type: "individual" | "ekiden";
  athleteInfos: AthleteInfo[];
  teamInfos: TeamInfo[];
}
interface SetupRecord {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
}

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
}

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

function WatchingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setupId = searchParams.get("setupId");
  const [setupList, setSetupList] = useState<SetupRecord[]>([]);
  const [data, setData] = useState<WatchingSetupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeg, setSelectedSeg] = useState<number | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());

  // セットアップ一覧を取得
  useEffect(() => {
    fetch("/api/watching-setup").then((r) => r.json()).then(setSetupList);
  }, []);

  // setupIdが指定されたら詳細を取得
  useEffect(() => {
    if (!setupId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/watching-setup/${setupId}`).then((r) => r.json()),
    ]).then(async ([setup]) => {
      const athleteIds: string[] = JSON.parse(setup.athleteIds || "[]");
      const teamSetup = setup.teamSetup ? JSON.parse(setup.teamSetup) : [];

      const allAthleteIds = new Set<string>(athleteIds);
      teamSetup.forEach((ts: { segments: { athleteId: string | null }[] }) => {
        ts.segments.forEach((s: { athleteId: string | null }) => { if (s.athleteId) allAthleteIds.add(s.athleteId); });
      });

      // 選手データを一括取得
      const athleteData: Record<string, AthleteInfo> = {};
      await Promise.all(
        Array.from(allAthleteIds).map(async (aid) => {
          const a = await fetch(`/api/athletes/${aid}`).then((r) => r.json());
          const recentRecords = (a.records || [])
            .filter((r: { date: string }) => new Date(r.date) >= oneYearAgo)
            .slice(0, 3)
            .map((r: { event: string; timeString: string; date: string; competitionName: string }) => ({ event: r.event, timeString: r.timeString, date: r.date, competitionName: r.competitionName }));
          const bestByEvent: Record<string, { timeSeconds: number; timeString: string }> = a.bestByEvent || {};
          const bestEntry = Object.entries(bestByEvent).sort((x, y) => (x[1] as { timeSeconds: number }).timeSeconds - (y[1] as { timeSeconds: number }).timeSeconds)[0];
          athleteData[aid] = {
            id: aid,
            nameKanji: a.nameKanji,
            team: a.team ?? null,
            personalBest: bestEntry ? { event: bestEntry[0], timeString: (bestEntry[1] as { timeString: string }).timeString } : null,
            recentRecords,
          };
        })
      );

      // チームデータを取得
      const teamInfos: TeamInfo[] = [];
      for (const ts of teamSetup) {
        const teamRes = await fetch(`/api/teams/${ts.teamId}`).then((r) => r.json());
        const segments = (ts.segments || []).map((s: { segmentNo: number; athleteId: string | null }) => ({
          segmentNo: s.segmentNo,
          athlete: s.athleteId ? athleteData[s.athleteId] || null : null,
        }));
        teamInfos.push({ id: ts.teamId, name: ts.teamName || teamRes.name, segments });
      }

      setData({
        id: setup.id,
        name: setup.name,
        type: setup.type,
        athleteInfos: athleteIds.map((id) => athleteData[id]).filter(Boolean),
        teamInfos,
      });
      // 最初のチームを展開
      if (teamInfos.length > 0) setExpandedTeams(new Set([teamInfos[0].id]));
      setLoading(false);
    });
  }, [setupId]);

  const toggleTeamExpand = (id: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAthleteSelect = (id: string) => {
    setSelectedAthleteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // セットアップ未選択
  if (!setupId) {
    return (
      <>
        <div className="page-header"><div className="page-title">観戦モード</div></div>
        <div className="card">
          <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "0.65rem" }}>セットアップを選択</div>
          {setupList.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
              セットアップがありません。
              <button onClick={() => router.push("/watching-setup")} className="link-text" style={{ fontSize: "11px", background: "none", border: "none", marginLeft: "4px" }}>観戦セットアップへ →</button>
            </div>
          ) : (
            setupList.map((s) => (
              <div key={s.id} className="check-row" onClick={() => router.push(`/watching?setupId=${s.id}`)}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginLeft: "8px" }}>
                    {s.type === "individual" ? "個人レース" : "駅伝"} · {formatDate(s.updatedAt)}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#1D9E75" }}>→</span>
              </div>
            ))
          )}
          <div style={{ marginTop: "0.75rem" }}>
            <button className="btn btn-primary" onClick={() => router.push("/watching-setup")}>+ 新しいセットアップ</button>
          </div>
        </div>
      </>
    );
  }

  if (loading || !data) {
    return <div style={{ padding: "2rem", textAlign: "center", fontSize: "12px", color: "var(--color-text-tertiary)" }}>読み込み中...</div>;
  }

  return (
    <>
      {/* ヘッダー */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "0.7rem 1rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500 }}>観戦モード — {data.type === "individual" ? "トラック / マラソン" : "駅伝"}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
            {data.name} · {data.type === "individual" ? `${data.athleteInfos.length}名` : `${data.teamInfos.length}チーム`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="btn" onClick={() => router.push("/watching")}>← セットアップ一覧</button>
          <button className="btn" onClick={() => router.push("/watching-setup")}>再設定</button>
        </div>
      </div>

      {/* 駅伝ビュー */}
      {data.type === "ekiden" && (
        <>
          {/* 区間セレクター */}
          <div style={{ display: "flex", gap: "5px", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn"
              style={{ borderRadius: "99px", background: selectedSeg === null ? "#1D9E75" : undefined, color: selectedSeg === null ? "white" : undefined, borderColor: selectedSeg === null ? "#1D9E75" : undefined }}
              onClick={() => setSelectedSeg(null)}
            >全チーム</button>
            {Array.from({ length: Math.max(...data.teamInfos.map((t) => t.segments.length), 1) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className="btn"
                style={{ borderRadius: "99px", background: selectedSeg === n ? "#1D9E75" : undefined, color: selectedSeg === n ? "white" : undefined, borderColor: selectedSeg === n ? "#1D9E75" : undefined }}
                onClick={() => setSelectedSeg(n)}
              >{n}区</button>
            ))}
          </div>

          {/* 全チームビュー */}
          {selectedSeg === null && (
            <div>
              {data.teamInfos.map((team, idx) => (
                <div key={team.id} style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", marginBottom: "0.6rem", overflow: "hidden" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.85rem", background: "var(--color-background-secondary)", cursor: "pointer" }}
                    onClick={() => toggleTeamExpand(team.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <span className={`rank-badge rank-${Math.min(idx + 1, 3) === idx + 1 ? idx + 1 : "n"}`}>{idx + 1}</span>
                      <span style={{ fontSize: "12px", fontWeight: 500 }}>{team.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", transform: expandedTeams.has(team.id) ? "rotate(90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>›</span>
                    </div>
                  </div>
                  {expandedTeams.has(team.id) && (
                    <>
                      <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                        {team.segments.map((seg) => (
                          <div key={seg.segmentNo} style={{ display: "flex", alignItems: "center", padding: "5px 0.85rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                            <div style={{ width: "28px", fontSize: "10px", color: "var(--color-text-tertiary)", flexShrink: 0 }}>{seg.segmentNo}区</div>
                            <div style={{ flex: 1 }}>
                              {seg.athlete ? (
                                <Link href={`/athletes/${seg.athlete.id}`} className="link-text" style={{ fontSize: "11px" }}>{seg.athlete.nameKanji}</Link>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>—</span>
                              )}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", width: "100px", textAlign: "right" }}>
                              {seg.athlete?.personalBest ? `${seg.athlete.personalBest.event} ${seg.athlete.personalBest.timeString}` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 区間比較ビュー */}
          {selectedSeg !== null && (
            <div>
              <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                {selectedSeg}区 — 各チームの担当選手
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "8px" }}>
                {data.teamInfos.map((team) => {
                  const seg = team.segments.find((s) => s.segmentNo === selectedSeg);
                  const athlete = seg?.athlete;
                  return (
                    <div key={team.id} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", padding: "0.65rem 0.85rem" }}>
                      <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "2px" }}>{team.name}</div>
                      {athlete ? (
                        <>
                          <Link href={`/athletes/${athlete.id}`} className="link-text" style={{ fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "0.35rem" }}>{athlete.nameKanji}</Link>
                          <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>所属: {athlete.team?.name || "—"}</div>
                          {athlete.personalBest && <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>PB {athlete.personalBest.event}: <strong style={{ color: "var(--color-text-primary)" }}>{athlete.personalBest.timeString}</strong></div>}
                          {athlete.recentRecords.slice(0, 1).map((r, i) => (
                            <div key={i} style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
                              直近: <strong style={{ color: "var(--color-text-primary)" }}>{r.timeString}</strong> ({formatDate(r.date)})
                            </div>
                          ))}
                        </>
                      ) : (
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>未割り当て</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 個人レースビュー */}
      {data.type === "individual" && (
        <>
          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "0.6rem" }}>
            エントリー選手の記録を比較できます。選手名をタップで詳細へ。
          </div>

          {/* 比較カード（選択した選手） */}
          {selectedAthleteIds.size > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px", marginBottom: "0.85rem" }}>
              {data.athleteInfos.filter((a) => selectedAthleteIds.has(a.id)).map((a) => (
                <div key={a.id} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-md)", border: "1.5px solid #9FE1CB", padding: "0.65rem 0.85rem" }}>
                  <Link href={`/athletes/${a.id}`} className="link-text" style={{ fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "2px" }}>{a.nameKanji}</Link>
                  <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>{a.team?.name || "—"}</div>
                  {a.personalBest && <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>PB: <strong style={{ color: "var(--color-text-primary)" }}>{a.personalBest.timeString}</strong></div>}
                  {a.recentRecords.map((r, i) => (
                    <div key={i} style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>{formatDate(r.date)}: <strong style={{ color: "var(--color-text-primary)" }}>{r.timeString}</strong></div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* 全選手テーブル */}
          <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: "0.4rem" }}>
            全エントリー選手 （チェックで比較）
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <colgroup>
                <col style={{ width: "5%" }} /><col style={{ width: "22%" }} /><col style={{ width: "18%" }} /><col style={{ width: "55%" }} />
              </colgroup>
              <thead><tr><th></th><th>選手名</th><th>所属</th><th>直近1年の記録</th></tr></thead>
              <tbody>
                {data.athleteInfos.map((a) => (
                  <tr key={a.id} style={{ cursor: "pointer", background: selectedAthleteIds.has(a.id) ? "#E1F5EE" : undefined }} onClick={() => toggleAthleteSelect(a.id)}>
                    <td>
                      <div className={`check-box ${selectedAthleteIds.has(a.id) ? "checked" : ""}`} style={{ margin: "0 auto" }}>✓</div>
                    </td>
                    <td>
                      <Link href={`/athletes/${a.id}`} className="link-text" onClick={(e) => e.stopPropagation()}>{a.nameKanji}</Link>
                    </td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{a.team?.name || "—"}</td>
                    <td style={{ whiteSpace: "normal", lineHeight: "1.7" }}>
                      {a.recentRecords.length === 0 ? (
                        <span style={{ color: "var(--color-text-tertiary)" }}>—</span>
                      ) : (
                        a.recentRecords.map((r, i) => (
                          <span key={i} style={{ marginRight: "8px" }}>
                            <span style={{ color: "var(--color-text-secondary)" }}>{formatDate(r.date)}:</span> {r.timeString}
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default function WatchingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", fontSize: "12px", color: "var(--color-text-tertiary)" }}>読み込み中...</div>}>
      <WatchingContent />
    </Suspense>
  );
}
