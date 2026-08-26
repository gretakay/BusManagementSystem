/**
 * 一次性腳本:將指定 email 的帳號設為 globalSuperLead(總領隊/師父,可管理所有行程)。
 * 用途:系統第一個管理者帳號,因為 roles collection 禁止 client 端寫入,
 * 必須用 Admin SDK 從伺服器端(或本機腳本)直接建立。
 *
 * 使用方式:
 *   1. 先在 Firebase Authentication 建立這個 email 的帳號(或讓對方自行註冊登入一次)
 *   2. 設定好 .env.local 的 FIREBASE_ADMIN_* 變數
 *   3. npx tsx scripts/bootstrapSuperLead.ts someone@example.com
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("用法: npx tsx scripts/bootstrapSuperLead.ts <email>");
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("請先在 .env.local 設定 FIREBASE_ADMIN_PROJECT_ID / _CLIENT_EMAIL / _PRIVATE_KEY");
    process.exit(1);
  }

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const user = await getAuth(app).getUserByEmail(email);

  await getFirestore(app)
    .collection("roles")
    .doc(user.uid)
    .set({ globalSuperLead: true, email: user.email ?? email, trips: {} }, { merge: true });

  console.log(`已將 ${email}(uid: ${user.uid}) 設為 globalSuperLead`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
