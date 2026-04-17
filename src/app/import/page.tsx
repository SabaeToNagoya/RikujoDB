"use client";
import { useState, useRef } from "react";
import Papa from "papaparse";

interface PreviewRow {
  athleteName: string;
  event: string;
  timeString: string;
  competitionName: string;
  date: string;
  teamName: string;
  ranking: string;
  notes: string;
  _raw: string[];
}

const CSV_TEMPLATE = "選手名,種目,記録,大会名,日付,所属チーム名,順位,備考\n田中 希実,1500m,4:02.31,世界選手権,2023/08/22,NB Japan,銅メダル,自己ベスト\n鈴木 健吾,マラソン,2:06:18,びわ湖毎日マラソン,2021/02/28,富士通,1,,";

export default function ImportPage() {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[]; duplicates: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (parsed) => {
        const rows = parsed.data as string[][];
        // ヘッダー行をスキップ
        const dataRows = rows[0]?.[0] === "選手名" ? rows.slice(1) : rows;
        const previewed = dataRows.map((row) => ({
          athleteName: row[0] || "",
          event: row[1] || "",
          timeString: row[2] || "",
          competitionName: row[3] || "",
          date: row[4] || "",
          teamName: row[5] || "",
          ranking: row[6] || "",
          notes: row[7] || "",
          _raw: row,
        }));
        setPreview(previewed);
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    const res = await fetch("/api/records/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview.map((r) => r._raw) }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
    if (data.success > 0) setPreview(null);
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\ufeff" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "記録取り込みテンプレート.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">記録取り込み</div>
      </div>

      {/* ステップ表示 */}
      <div style={{ marginBottom: "0.9rem" }}>
        <StepItem n={1} label="CSVをアップロード" desc="自分で作成したCSVファイルをアップロードしてください" active={!preview} done={!!preview} />
        <StepItem n={2} label="内容を確認して登録" desc="プレビューで内容を確認し、OKなら取り込み実行" active={!!preview} />
      </div>

      {/* アップロードエリア */}
      {!preview && (
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
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div className="card">
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>CSVフォーマット（列の順序）</div>
            <table className="data-table">
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
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
                  <th>順位</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: "var(--color-text-tertiary)" }}>例</td>
                  <td style={{ color: "var(--color-text-tertiary)" }}>鈴木 健吾</td>
                  <td style={{ color: "var(--color-text-tertiary)" }}>マラソン</td>
                  <td style={{ color: "var(--color-text-tertiary)" }}>2:06:18</td>
                  <td style={{ color: "var(--color-text-tertiary)" }}>びわ湖毎日マラソン</td>
                  <td style={{ color: "var(--color-text-tertiary)" }}>2021/2/28</td>
                  <td style={{ color: "var(--color-text-tertiary)" }}>富士通</td>
                  <td style={{ color: "var(--color-text-tertiary)" }}>1位</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>
              * 必須項目。選手名はDBに登録済みの漢字氏名と一致している必要があります。
            </div>
          </div>
        </>
      )}

      {/* プレビュー */}
      {preview && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
            <div style={{ fontSize: "12px", fontWeight: 500 }}>
              プレビュー: {fileName}（{preview.length}件）
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="btn" onClick={() => { setPreview(null); setFileName(""); }}>やり直す</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? "取り込み中..." : `${preview.length}件を取り込む`}
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <colgroup>
                <col style={{ width: "16%" }} /><col style={{ width: "12%" }} /><col style={{ width: "10%" }} /><col style={{ width: "22%" }} /><col style={{ width: "11%" }} /><col style={{ width: "15%" }} /><col style={{ width: "8%" }} /><col style={{ width: "6%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>選手名</th><th>種目</th><th>記録</th><th>大会名</th><th>日付</th><th>所属チーム</th><th>順位</th><th>備考</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{row.athleteName || <span style={{ color: "#e53e3e" }}>空</span>}</td>
                    <td>{row.event}</td>
                    <td>{row.timeString}</td>
                    <td>{row.competitionName}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{row.date}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{row.teamName || "—"}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{row.ranking || "—"}</td>
                    <td style={{ color: "var(--color-text-tertiary)" }}>{row.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div style={{ padding: "0.5rem", textAlign: "center", fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                ...他{preview.length - 50}件
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
