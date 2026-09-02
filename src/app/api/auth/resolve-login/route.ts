import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { isValidTaiwanMobile, normalizeTaiwanMobile } from "@/lib/phone";

/**
 * 登入頁支援用手機號碼登入:這支 API 故意不需要身分驗證(登入前根本還沒有身分),
 * 只負責把手機號碼換成對應帳號的 email,前端拿到 email 後再用 Firebase Auth 的
 * signInWithEmailAndPassword 完成登入(密碼驗證仍完全交給 Firebase Auth)。
 * 只回傳「有沒有對應到帳號」與 email,不回傳密碼以外任何其他資訊。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
    if (!identifier) {
      return NextResponse.json({ error: "請輸入帳號" }, { status: 400 });
    }

    if (identifier.includes("@")) {
      return NextResponse.json({ email: identifier });
    }

    const phone = normalizeTaiwanMobile(identifier);
    if (!isValidTaiwanMobile(phone)) {
      return NextResponse.json({ error: "找不到此帳號" }, { status: 404 });
    }

    const snap = await getAdminDb()
      .collection("roles")
      .where("loginPhone", "==", phone)
      .limit(1)
      .get();
    const email = snap.empty ? undefined : (snap.docs[0]!.data() as { email?: string }).email;
    if (!email) {
      return NextResponse.json({ error: "找不到此帳號" }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch {
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 });
  }
}
