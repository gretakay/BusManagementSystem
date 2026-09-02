"use client";

import { useEffect, useRef, useState } from "react";

export interface EmailOption {
  email: string;
  displayName?: string;
}

/**
 * 原生 <datalist> 沒辦法在下拉選項裡顯示「名稱」又帶入不同的 email 值(多數瀏覽器只會顯示 value 本身),
 * 所以自己做一個簡單的下拉選單:顯示「名稱(email)」,點選後把 email 填進輸入框,一樣可以自由輸入新 email。
 */
export function EmailAutocomplete({
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  options: EmailOption[];
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) => {
    const q = value.trim().toLowerCase();
    if (!q) return true;
    return o.email.toLowerCase().includes(q) || (o.displayName ?? "").toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className="relative">
      <input
        type="email"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map((o) => (
            <li key={o.email}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.email);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {o.displayName ? (
                  <>
                    <span className="font-medium">{o.displayName}</span>
                    <span className="ml-1 text-xs text-gray-400">{o.email}</span>
                  </>
                ) : (
                  o.email
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
