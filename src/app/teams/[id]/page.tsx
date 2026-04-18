"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface TeamAthlete {
  id: string;
  nameKanji: string;
  dateOfBirth: string | null;
  team: { id: string; name: string } | null;
  mainEvent: string | null;
  bestByEvent: Record<string, string>;
}
interface TeamDetail {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  currentAthletes?: TeamAthlete[];
  formerAthletes?: TeamAthlete[];
  error?: string;
}

function AthleteTable({
  athletes,
  emptyMessage,
}: {
  athletes: TeamAthlete[];
  emptyMessage: string;
}) {
  if (athletes.length === 0) {
    return (
      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.4rem 0" }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <table className="data-table">
      <colgroup>
        <col style={{ width: "26%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "46%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>氏名</th>
          <th>現所属</th>
          <th>主種目</th>
          <th>自己ベスト</th>
        </tr>
      </thead>
      <tbody>
        {athletes.map((a) => (
          <tr key={a.id}>
            <td>
              <Link href={`/athletes/${a.id}`} className="link-text">
                {a.nameKanji}
              </Link>
            </td>
            <td style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
              {a.team ? a.team.name : "—"}
            </td>
            <td>{a.mainEvent || "—"}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>
              {Object.entries(a.bestByEvent)
                .slice(0, 3)
                .map(([ev, t]) => `${ev}: ${t}`)
                .join("  /  ") || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<TeamDetail | null>(null);

  const reload = () =>
    fetch(`/api/teams/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !data.id) {
          console.error("API error:", data);
        } else {
          setTeam(data);
        }
      })
      .catch((e) => console.error("fetch error:", e));

  useEffect(() => {
    reload();
  }, [id]);

  if (!team) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
        読み込み中...
      </div>
    );
  }

  const typeBadge =
    team.type === "実業団"
      ? "badge-green"
      : team.type === "大学"
      ? "badge-purple"
      : "badge-orange";

  const formerLabel =
    team.type === "大学" ? "卒業生" : team.type === "高校" ? "卒業生" : "過去の所属選手";
  const totalAthletes = (team.currentAthletes?.length ?? 0) + (team.formerAthletes?.length ?? 0);

  return (
    <>
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => router.push("/teams")}>
          チーム
        </button>
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
          {team.notes && (
            <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
              {team.notes}
            </div>
          )}
        </div>
      </div>

      {/* 所属選手 */}
      <div className="card">
        {/* 現在のメンバー */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#0F6E56",
            }} />
            現在のメンバー
            <span style={{ fontWeight: 400, color: "var(--color-text-tertiary)" }}>
              {team.currentAthletes?.length ?? 0}名
            </span>
          </div>
          <AthleteTable
            athletes={team.currentAthletes ?? []}
            emptyMessage="現在のメンバーが登録されていません"
          />
        </div>

        {/* 過去のメンバー */}
        {((team.formerAthletes?.length ?? 0) > 0 || team.type === "大学" || team.type === "高校") && (
          <div>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
              marginTop: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "0.75rem",
            }}>
              <span style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#aaa",
              }} />
              {formerLabel}
              <span style={{ fontWeight: 400, color: "var(--color-text-tertiary)" }}>
                {team.formerAthletes?.length ?? 0}名
              </span>
            </div>
            <AthleteTable
              athletes={team.formerAthletes ?? []}
              emptyMessage={`${formerLabel}が登録されていません`}
            />
          </div>
        )}

        {totalAthletes === 0 && (
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", padding: "0.5rem 0" }}>
            このチームに登録された選手がいません
          </div>
        )}
      </div>
    </>
  );
}
