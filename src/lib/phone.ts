/**
 * 手機號碼欄位常見的漏打/被 Excel 轉成數字問題:開頭的 0 不見了(0912345678 -> 912345678)。
 * 台灣手機固定 09 開頭共 10 碼,偵測到少一碼的「9 開頭 9 碼」就自動補回開頭的 0。
 */
export function normalizeTaiwanMobile(value: string): string {
  return /^9\d{8}$/.test(value) ? `0${value}` : value;
}

/** 台灣手機號碼格式檢查(09 開頭共 10 碼),用於登入手機號碼等需要嚴格格式的欄位。 */
export function isValidTaiwanMobile(value: string): boolean {
  return /^09\d{8}$/.test(value);
}
