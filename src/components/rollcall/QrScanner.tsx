"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ELEMENT_ID = "qr-scanner-region";

/**
 * 掃描外部報名系統發放的 QR Code(內容為報名序號的純文字/數字)。
 * 本系統不產生/列印 QR Code,只負責掃描比對(規格書 §5.3)。
 */
export function QrScanner({
  onDecode,
  onClose,
}: {
  onDecode: (text: string) => void;
  onClose: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => onDecodeRef.current(decodedText),
        () => {
          // 單次掃描失敗屬正常情況(尚未對準),不需特別處理
        },
      )
      .catch((err) => {
        console.error("QR 掃描器啟動失敗,請確認已授權相機權限", err);
      });

    return () => {
      if (!scanner.isScanning) return;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <div id={ELEMENT_ID} className="mx-auto max-w-xs" />
      <button onClick={onClose} className="w-full rounded-md border border-gray-300 py-1.5 text-sm">
        關閉掃描
      </button>
    </div>
  );
}
