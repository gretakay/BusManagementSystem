"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import { apiFetch } from "@/lib/api/client";
import { useTripAccess } from "@/lib/auth/useTripAccess";
import type {
  ImportPassengersResult,
  PassengerIdentity,
  PassengerListItem,
  UpsertPassengerInput,
} from "@/types/passenger";

const IDENTITY_LABELS: Record<PassengerIdentity, string> = {
  guest: "貴賓",
  believer: "信眾",
  volunteer: "義工",
};

const emptyForm: UpsertPassengerInput = {
  regNo: "",
  name: "",
  dharmaName: "",
  phone: "",
  identity: "believer",
  volunteerGroup: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  lodgingInfo: "",
};

/** Excel/CSV 匯入時允許的欄位表頭(中文) -> 內部欄位名稱 */
const HEADER_MAP: Record<string, keyof UpsertPassengerInput> = {
  報名序號: "regNo",
  姓名: "name",
  法名: "dharmaName",
  手機號碼: "phone",
  身分別: "identity",
  義工組別: "volunteerGroup",
  緊急聯絡人姓名: "emergencyContactName",
  緊急聯絡人電話: "emergencyContactPhone",
  寮房資訊: "lodgingInfo",
};

const IDENTITY_FROM_TEXT: Record<string, PassengerIdentity> = {
  貴賓: "guest",
  信眾: "believer",
  義工: "volunteer",
  guest: "guest",
  believer: "believer",
  volunteer: "volunteer",
};

export default function PassengersPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const access = useTripAccess(tripId);
  const [passengers, setPassengers] = useState<PassengerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<UpsertPassengerInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ImportPassengersResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPassengers = useCallback(async () => {
    setLoading(true);
    try {
      const items = await apiFetch<PassengerListItem[]>(`/api/trips/${tripId}/passengers`);
      setPassengers(items);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadPassengers();
  }, [loadPassengers]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch(`/api/trips/${tripId}/passengers`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      await loadPassengers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "新增失敗");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDownloadTemplate() {
    const headers = Object.keys(HEADER_MAP);
    const sampleRows = [
      ["0001", "王小明", "法明", "0912345678", "信眾", "", "王大明", "0987654321", "A棟101"],
      ["0002", "陳小華", "", "0922333444", "義工", "香積組", "陳大華", "0933222111", "B棟205"],
      ["0003", "林小芳", "", "0955666777", "貴賓", "", "", "", ""],
    ];
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    sheet["!cols"] = headers.map((h) => ({ wch: Math.max(h.length * 2, 12) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "人員名單");
    XLSX.writeFile(workbook, "人員匯入範例.xlsx");
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]!];
      if (!sheet) throw new Error("找不到工作表內容");
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const rows: UpsertPassengerInput[] = raw.map((row) => {
        const mapped: Partial<UpsertPassengerInput> = {};
        for (const [header, value] of Object.entries(row)) {
          const key = HEADER_MAP[header.trim()];
          if (!key) continue;
          if (key === "identity") {
            mapped.identity = IDENTITY_FROM_TEXT[String(value).trim()] ?? "believer";
          } else {
            (mapped as Record<string, unknown>)[key] = String(value).trim();
          }
        }
        return { ...emptyForm, ...mapped };
      });

      const result = await apiFetch<ImportPassengersResult>(`/api/trips/${tripId}/passengers/import`, {
        method: "POST",
        body: JSON.stringify({ rows }),
      });
      setImportResult(result);
      await loadPassengers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "匯入失敗");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!access.isSuperLead) {
    return <p className="text-sm text-red-600">你沒有權限查看此行程的人員管理。</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">人員管理</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-gray-500">批次匯入(Excel/CSV)</h2>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-brand-600"
          >
            下載範例檔
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          表頭需包含:報名序號、姓名、法名、手機號碼、身分別(貴賓/信眾/義工)、義工組別、緊急聯絡人姓名、緊急聯絡人電話。
          以報名序號比對,重新匯入同一份檔案會更新既有資料(Upsert),不會清空重建。
          個別列格式錯誤只會該列失敗,其餘正確的列仍會照常匯入。
        </p>
        <p className="mt-1 text-xs text-amber-600">
          建議直接用上方「下載範例檔」修改,若自行在 Excel 輸入報名序號、手機號碼,
          請先將該欄位格式設為「文字」,避免開頭的 0 被 Excel 自動去掉。
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={importing}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
          }}
          className="mt-3 text-sm"
        />
        {importResult && (
          <div className="mt-3 text-sm">
            <p>
              新增 {importResult.createdCount} 筆、更新 {importResult.updatedCount} 筆
              {importResult.errors.length > 0 && `、錯誤 ${importResult.errors.length} 筆`}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-red-600">
                {importResult.errors.map((e, i) => (
                  <li key={i}>
                    第 {e.row} 列:{e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="grid max-w-lg gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-500">逐筆新增人員</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="報名序號"
            value={form.regNo}
            onChange={(e) => setForm((f) => ({ ...f, regNo: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="姓名"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="法名"
            value={form.dharmaName}
            onChange={(e) => setForm((f) => ({ ...f, dharmaName: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="手機號碼"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={form.identity}
            onChange={(e) => setForm((f) => ({ ...f, identity: e.target.value as PassengerIdentity }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.entries(IDENTITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {form.identity === "volunteer" && (
            <input
              placeholder="義工組別(自由輸入,例如:香積組)"
              value={form.volunteerGroup}
              onChange={(e) => setForm((f) => ({ ...f, volunteerGroup: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          )}
          <input
            placeholder="緊急聯絡人姓名"
            value={form.emergencyContactName}
            onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="緊急聯絡人電話"
            value={form.emergencyContactPhone}
            onChange={(e) => setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="寮房資訊"
            value={form.lodgingInfo}
            onChange={(e) => setForm((f) => ({ ...f, lodgingInfo: e.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "儲存中…" : "新增/更新人員"}
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
          人員清單({passengers.length})
        </h2>
        {loading ? (
          <p className="p-4 text-sm text-gray-400">載入中…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-400">
                <tr>
                  <th className="px-4 py-2">序號</th>
                  <th className="px-4 py-2">姓名</th>
                  <th className="px-4 py-2">身分別</th>
                  <th className="px-4 py-2">義工組別</th>
                  <th className="px-4 py-2">寮房</th>
                  <th className="px-4 py-2">車次</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{p.regNo}</td>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{IDENTITY_LABELS[p.identity]}</td>
                    <td className="px-4 py-2">{p.volunteerGroup || "-"}</td>
                    <td className="px-4 py-2">{p.lodgingInfo || "-"}</td>
                    <td className="px-4 py-2">{p.busId || "未分配"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
