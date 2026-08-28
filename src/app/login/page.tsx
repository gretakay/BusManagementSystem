"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      router.replace("/trips");
    } catch {
      setError("登入失敗,請確認帳號密碼是否正確");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("請先在上面輸入你的 Email,再點忘記密碼");
      return;
    }
    setError(null);
    setInfo(null);
    setResetting(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setInfo("已寄出密碼重設信,請檢查信箱(含垃圾郵件夾)。若沒收到,可能是帳號不存在或 email 打錯,請聯絡總領隊。");
    } catch {
      setInfo("已寄出密碼重設信,請檢查信箱(含垃圾郵件夾)。若沒收到,可能是帳號不存在或 email 打錯,請聯絡總領隊。");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold">遊覽車點名系統</h1>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">密碼</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "登入中…" : "登入"}
        </button>
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetting}
          className="w-full text-center text-sm text-brand-600 disabled:opacity-60"
        >
          {resetting ? "寄送中…" : "忘記密碼?"}
        </button>
        <p className="text-xs text-gray-400">
          帳號由總負責人建立,若無法登入請聯絡總領隊/師父。
        </p>
      </form>
    </div>
  );
}
