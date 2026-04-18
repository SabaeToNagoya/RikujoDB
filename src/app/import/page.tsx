"use client";
import { useState, useRef } from "react";
import Papa from "papaparse";

type ImportMode = "record" | "athlete" | "team";

// ===== 記録 =====
interface RecordRow {
  athleteName: string;
  event: string;
  timeString: string;
  competitionName: string;
  date: string;
  teamName: string;
  segment: string;
  notes: string;
  _raw: string[];
}

// ===== 選手 =====
interface AthleteRow {
  nameKanji: string;
  nameFurigana: string;
  gender: string;
  dateOfBirth: string;
  prefecture: string;
  highSchool: string;
  university: string;
  teamName: string;
  notes: string;
  _raw: string[];
}

// ===== チーム =====
interface TeamRow {
  name: string;
  type: string;
  notes: string;
  _raw: string[];
}

const RECORD_TEMPLATE = "選手名,種目,記録,大会名,日付,所属チーム名,区間,メモ\n田中 希実,1500m,4:02.31,世界選手権,2023/08/22,NB Japan,,自己ベスト\n鈴木 健吾,駅伝,1:02:18,箱根駅伝,2021/01/02,富士通,2区,";
const ATHLETE_TEMPLATE = "氏名（漢字）,ふりがな,性別,生年月日,出身都道府県,出身高校,出身大学,所属チーム名,備考\n鈴木 健吾,すずき けんご,男性,1996/03/02,静岡県,浜松日体高校,東海大学,富士通,";
const TEAM_TEMPLATE = "チーム名,種別,備考\n富士通,実業団,\n東海大学,大学,";

export default function ImportPage() {
  const [mode, setMode] = useState<ImportMode>("record");

  // 記録
  const [recordPreview, setRecordPreview] = useState<RecordRow[] | null>(null);
  const [recordFileName, setRecordFileName] = useState("");
  const [recordResult, setRecordResult] = useState<{ success: number; errors: string[]; duplicates: number } | null>(null);

  // 選手
  const [athletePreview, setAthletePreview] = useState<AthleteRow[] | null>(null);
  const [athleteFileName, setAthleteFileName] = useState("");
  const [athleteResult, setAthleteResult] = useState<{ success: number; errors: string[]; duplicates: number } | null>(null);

  // チーム
  const [teamPreview, setTeamPreview] = useState<TeamRow[] | null>(null);
  const [teamFileName, setTeamFileName] = useState("");
  const [teamResult, setTeamResult] = useState<{ success: number; errors: string[]; duplicates: number } | null>(null);

  const [importing, setImporting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // モード切り替え時にプレビューをリセット
  const handleModeChange = (m: ImportMode) => {
    setMode(m);
  };

  // ===== ファイル読み込み =====
  const handleFile = (file: File) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (parsed) => {
        const rows = parsed.data as string[][];
        if (mode === "record") {
          setRecordResult(null);
          setRecordFileName(file.name);
          const dataRows = rows[0]?.[0] === "選手名" ? rows.slice(1) : rows;
          setRecordPreview(dataRows.map((row) => ({
            athleteName: row[0] || "",
            event: row[1] || "",
            timeString: row[2] || "",
            competitionName: row[3] || "",
            date: row[4] || "",
            teamName: row[5] || "",
            segment: row[6] || "",
            notes: row[7] || "",
            _raw: row,
          })));
        } else if (mode === "athlete") {
          setAthleteResult(null);
          setAthleteFileName(file.name);
          const dataRows = rows[0]?.[0] === "氏名（漢字）" ? rows.slice(1) : rows;
          setAthletePreview(dataRows.map((row) => ({
            nameKanji: row[0] || "",
            nameFurigana: row[1] || "",
            gender: row[2] || "",
            dateOfBirth: row[3] || "",
            prefecture: row[4] || "",
            highSchool: row[5] || "",
            university: row[6] || "",
            teamName: row[7] || "",
            notes: row[8] || "",
            _raw: row,
          })));
        } else {
          setTeamResult(null);
          setTeamFileName(file.name);
          const dataRows = rows[0]?.[0] === "チーム名" ? rows.slice(1) : rows;
          setTeamPreview(dataRows.map((row) => ({
            name: row[0] || "",
            type: row[1] || "",
            notes: row[2] || "",
            _raw: row,
          })));
        }
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  };

  // ===== 取り込み実行 =====
  const handleImport = async () => {
    setImporting(true);
    if (mode === "record" && recordPreview) {
      const res = await fetch("/api/records/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: recordPreview.map((r) => r._raw) }),
      });
      const data = await res.json();
      setRecordResult(data);
      if (data.success > 0) setRecordPreview(null);
    } else if (mode === "athlete" && athletePreview) {
      const res = await fetch("/api/athletes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: athletePreview.map((r) => r._raw) }),
      });
      const data = await res.json();
      setAthleteResult(data);
      if (data.success > 0) setAthletePreview(null);
    } else if (mode === "team" && teamPreview) {
      const res = await fetch("/api/teams/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: teamPreview.map((r) => r._raw) }),
      });
      const data = await res.json();
      setTeamResult(data);
      if (data.success > 0) setTeamPreview(null);
    }
    setImporting(false);
  };

  // ===== テンプレートDL =====
  const downloadTemplate = () => {
    let template = RECORD_TEMPLATE;
    let filename = "記録取り込みテンプレート.csv";
    if (mode === "athlete") { template = ATHLETE_TEMPLATE; filename = "選手取り込みテンプレート.csv"; }
    if (mode === "team") { template = TEAM_TEMPLATE; filename = "チーム取り込みテンプレート.csv"; }
    const blob = new Blob(["\ufeff" + template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasPreview = mode === "record" ? !!recordPreview : mode === "athlete" ? !!athletePreview : !!teamPreview;
  const previewCount = mode === "record" ? recordPreview?.length : mode === "athlete" ? athletePreview?.length : teamPreview?.length;
  const fileName = mode === "record" ? recordFileName : mode === "athlete" ? athleteFileName : teamFileName;
  const result = mode === "record" ? recordResult : mode === "athlete" ? athleteResult : teamResult;

  const resetPreview = () => {
    if (mode === "record") { setRecordPreview(null); setRecordFileName(""); }
    else if (mode === "athlete") { setAthletePreview(null); setAthleteFileName(""); }
    else { setTeamPreview(null); setTeamFileName(""); }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">取り込み</div>
      </div>

      {/* ラジオボタン */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "0.9rem" }}>
        {(["record", "athlete", "team"] as ImportMode[]).map((m) => {
          const label = m === "record" ? "記録" : m === "athlete" ? "選手" : "チーム";
          const active = mode === m;
          return (
            <label
              key={m}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 12px",
                borderRadius: "var(--border-radius-md)",
                border: `0.5px solid ${active ? "#1D9E75" : "var(--color-border-secondary)"}`,
                background: active ? "#E1F5EE" : "var(--color-background-secondary)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: active ? 600 : 400,
                color: active ? "#1D9E75" : "var(--color-text-secondary)",
                userSelect: "none",
              }}
            >
              <input
                type="radio"
                name="importMode"
                value={m}
                checked={active}
                onChange={() => handleModeChange(m)}
                style={{ display: "none" }}
              />
              {label}
            </label>
          );
        })}
      </div>

      {/* ステップ表示 */}
      <div style={{ marginBottom: "0.9rem" }}>
        <StepItem n={1} label="CSVをアップロード" desc="自分で作成したCSVファイルをアップロードしてください" active={!hasPreview} done={hasPreview} />
        <StepItem n={2} label="内容を確認して登録" desc="プレビューで内容を確認し、OKなら取り込み実行" active={hasPreview} />
      </div>

      {/* アップロードエリア */}
      {!hasPreview && (
        <>
          <div
            className="upload-box"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: "24px", color: "var(--color-text-tertiary)", marginBottom: "0.4rem" }}>↑</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
              CSVファイルをここにドロップ、またはクリックして選択
            </div>
            <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
              テンプレートは
              <button onClick={(e) => { e.stopPropagation(); downloadTemplate(); }} className="link-text" style={{ fontSize: "10px", background: "none", border: "none" }}> こちら </button>
              からダウンロード
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = ""; } }} />

          {/* フォーマット説明 */}
          <div className="card">
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>CSVフォーマット（列の順序）</div>
            {mode === "record" && <RecordFormatTable />}
            {mode === "athlete" && <AthleteFormatTable />}
            {mode === "team" && <TeamFormatTable />}
          </div>
        </>
      )}

      {/* プレビュー */}
      {hasPreview && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
            <div style={{ fontSize: "12px", fontWeight: 500 }}>
              プレビュー: {fileName}（{previewCount}件）
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="btn" onClick={resetPreview}>やり直す</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? "取り込み中..." : `${previewCount}件を取り込む`}
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {mode === "record" && recordPreview && <RecordPreviewTable rows={recordPreview} />}
            {mode === "athlete" && athletePreview && <AthletePreviewTable rows={athletePreview} />}
            {mode === "team" && teamPreview && <TeamPreviewTable rows={teamPreview} />}
            {(previewCount ?? 0) > 50 && (
              <div style={{ padding: "0.5rem", textAlign: "center", fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                ...他{(previewCount ?? 0) - 50}件
              </div>
            )}
          </div>
        </>
      )}

      {/* 取り込み結果 */}
      {result && (
        <div style={{
          padding: "0.9rem",
          borderRadius: "var(--border-radius-lg)",
          border: `0.5px solid ${result.errors.length > 0 ? "#fca5a5" : "#9FE1CB"}`,
          background: result.errors.length > 0 ? "#fef2f2" : "#E1F5EE",
          marginTop: "0.9rem",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "0.4rem" }}>
            {result.success > 0 ? `✓ ${result.success}件を取り込みました` : "取り込み完了"}
          </div>
          {result.duplicates > 0 && <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>重複スキップ: {result.duplicates}件</div>}
          {result.errors.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "11px", fontWeight: 500, color: "#991b1b", marginBottom: "0.25rem" }}>エラー ({result.errors.length}件)</div>
              {result.errors.slice(0, 10).map((e, i) => (
                <div key={i} style={{ fontSize: "10px", color: "#991b1b" }}>{e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ===== フォーマット説明テーブル =====

function RecordFormatTable() {
  return (
    <>
      <table className="data-table">
        <colgroup>
          <col style={{ width: "5%" }} /><col style={{ width: "13%" }} /><col style={{ width: "10%" }} /><col style={{ width: "10%" }} /><col style={{ width: "20%" }} /><col style={{ width: "10%" }} /><col style={{ width: "13%" }} /><col style={{ width: "10%" }} /><col style={{ width: "9%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>選手名<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>種目<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>記録<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>大会名<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>日付<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>所属チーム名</th>
            <th>区間</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ color: "var(--color-text-tertiary)" }}>例</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>鈴木 健吾</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>駅伝</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>1:02:18</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>箱根駅伝</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>2021/1/2</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>富士通</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>2区</td>
            <td style={{ color: "var(--color-text-tertiary)" }}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>
        * 必須項目。選手名はDBに登録済みの漢字氏名と一致している必要があります。区間は駅伝のみ入力。
      </div>
    </>
  );
}

function AthleteFormatTable() {
  return (
    <>
      <table className="data-table">
        <colgroup>
          <col style={{ width: "5%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "8%" }} /><col style={{ width: "10%" }} /><col style={{ width: "10%" }} /><col style={{ width: "12%" }} /><col style={{ width: "12%" }} /><col style={{ width: "12%" }} /><col style={{ width: "5%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>氏名（漢字）<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>ふりがな<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>性別<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>生年月日</th>
            <th>出身都道府県</th>
            <th>出身高校</th>
            <th>出身大学</th>
            <th>所属チーム名</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ color: "var(--color-text-tertiary)" }}>例</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>鈴木 健吾</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>すずき けんご</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>男性</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>1996/03/02</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>静岡県</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>浜松日体</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>東海大学</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>富士通</td>
            <td style={{ color: "var(--color-text-tertiary)" }}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>
        * 必須項目。性別は「男性」または「女性」で入力。同じ氏名（漢字）がDBに存在する場合はスキップされます。
      </div>
    </>
  );
}

function TeamFormatTable() {
  return (
    <>
      <table className="data-table">
        <colgroup>
          <col style={{ width: "5%" }} /><col style={{ width: "30%" }} /><col style={{ width: "20%" }} /><col style={{ width: "45%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>チーム名<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>種別<span style={{ color: "#e53e3e" }}>*</span></th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ color: "var(--color-text-tertiary)" }}>例</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>富士通</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>実業団</td>
            <td style={{ color: "var(--color-text-tertiary)" }}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>
        * 必須項目。種別は「実業団」「大学」「高校」のいずれかで入力。同じチーム名がDBに存在する場合はスキップされます。
      </div>
    </>
  );
}

// ===== プレビューテーブル =====

function RecordPreviewTable({ rows }: { rows: RecordRow[] }) {
  return (
    <table className="data-table">
      <colgroup>
        <col style={{ width: "14%" }} /><col style={{ width: "10%" }} /><col style={{ width: "10%" }} /><col style={{ width: "20%" }} /><col style={{ width: "10%" }} /><col style={{ width: "14%" }} /><col style={{ width: "10%" }} /><col style={{ width: "12%" }} />
      </colgroup>
      <thead>
        <tr><th>選手名</th><th>種目</th><th>記録</th><th>大会名</th><th>日付</th><th>所属チーム</th><th>区間</th><th>メモ</th></tr>
      </thead>
      <tbody>
        {rows.slice(0, 50).map((row, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 500 }}>{row.athleteName || <span style={{ color: "#e53e3e" }}>空</span>}</td>
            <td>{row.event}</td>
            <td>{row.timeString}</td>
            <td>{row.competitionName}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.date}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.teamName || "—"}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.segment || "—"}</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>{row.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AthletePreviewTable({ rows }: { rows: AthleteRow[] }) {
  return (
    <table className="data-table">
      <colgroup>
        <col style={{ width: "14%" }} /><col style={{ width: "14%" }} /><col style={{ width: "8%" }} /><col style={{ width: "11%" }} /><col style={{ width: "10%" }} /><col style={{ width: "12%" }} /><col style={{ width: "12%" }} /><col style={{ width: "12%" }} /><col style={{ width: "7%" }} />
      </colgroup>
      <thead>
        <tr><th>氏名（漢字）</th><th>ふりがな</th><th>性別</th><th>生年月日</th><th>都道府県</th><th>出身高校</th><th>出身大学</th><th>所属チーム</th><th>備考</th></tr>
      </thead>
      <tbody>
        {rows.slice(0, 50).map((row, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 500 }}>{row.nameKanji || <span style={{ color: "#e53e3e" }}>空</span>}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.nameFurigana || "—"}</td>
            <td>{row.gender || <span style={{ color: "#e53e3e" }}>空</span>}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.dateOfBirth || "—"}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.prefecture || "—"}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.highSchool || "—"}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.university || "—"}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{row.teamName || "—"}</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>{row.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamPreviewTable({ rows }: { rows: TeamRow[] }) {
  return (
    <table className="data-table">
      <colgroup>
        <col style={{ width: "40%" }} /><col style={{ width: "25%" }} /><col style={{ width: "35%" }} />
      </colgroup>
      <thead>
        <tr><th>チーム名</th><th>種別</th><th>備考</th></tr>
      </thead>
      <tbody>
        {rows.slice(0, 50).map((row, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 500 }}>{row.name || <span style={{ color: "#e53e3e" }}>空</span>}</td>
            <td>{row.type || <span style={{ color: "#e53e3e" }}>空</span>}</td>
            <td style={{ color: "var(--color-text-tertiary)" }}>{row.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StepItem({ n, label, desc, active, done }: { n: number; label: string; desc: string; active?: boolean; done?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "0.65rem", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", marginBottom: "6px" }}>
      <div style={{
        width: "19px", height: "19px", borderRadius: "50%",
        background: done ? "#9FE1CB" : active ? "#1D9E75" : "var(--color-border-secondary)",
        color: active || done ? "white" : "var(--color-text-secondary)",
        fontSize: "10px", fontWeight: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {done ? "✓" : n}
      </div>
      <div>
        <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</div>
        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{desc}</div>
      </div>
    </div>
  );
}
