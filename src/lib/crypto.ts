import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * 手機號碼 / 緊急聯絡人電話的應用層加密(規格書 §5.5)。
 * AES-256-GCM,金鑰僅存在伺服器端環境變數 ENCRYPTION_KEY,絕不送到前端。
 * 密文格式:base64(iv) + ":" + base64(authTag) + ":" + base64(ciphertext)
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY 未設定,無法加密/解密敏感欄位(參考 .env.local.example)");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY 長度需為 32 bytes(建議以 `openssl rand -base64 32` 產生)");
  }
  return key;
}

export function encryptField(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

/** 取電話號碼末 4 碼(去除非數字字元),供點名頁後端查詢比對用,明碼存放。 */
export function phoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export function decryptField(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("加密欄位格式錯誤,無法解密");
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plainText = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return plainText.toString("utf8");
}
