/**
 * タイム文字列（例: "2:06:35" or "13:05.23"）を秒に変換
 */
export function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  if (parts.length === 3) {
    // H:MM:SS または H:MM:SS.ms
    const [h, m, s] = parts;
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  } else if (parts.length === 2) {
    // MM:SS または MM:SS.ms
    const [m, s] = parts;
    return parseInt(m) * 60 + parseFloat(s);
  }
  return 0;
}

/**
 * 秒をタイム文字列に変換
 */
export function secondsToTimeString(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * 種目リスト
 */
export const EVENTS = [
  "800m",
  "1500m",
  "3000m",
  "3000mSC",
  "5000m",
  "10000m",
  "ハーフマラソン",
  "マラソン",
  "駅伝（区間）",
  "その他",
];

/**
 * 都道府県リスト
 */
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];
