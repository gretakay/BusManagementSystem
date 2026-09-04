import "server-only";
import { NextResponse } from "next/server";
import { UnauthorizedError, ForbiddenError, ConflictError } from "@/lib/auth/session";
import { ZodError } from "zod";

/** API route 統一錯誤處理,轉成一致的 JSON 錯誤格式與 HTTP 狀態碼。 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "輸入資料格式錯誤", issues: error.issues }, { status: 400 });
  }
  if (error instanceof Error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.error(error);
  return NextResponse.json({ error: "未知錯誤" }, { status: 500 });
}
