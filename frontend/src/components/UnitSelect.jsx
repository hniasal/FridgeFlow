"use client";

import { useState, useEffect } from "react";
import { COMMON_UNITS } from "../utils/formatters";

export default function UnitSelect({
  value,
  onChange,
  className = "",
  compact = false,
}) {
  const isKnown = COMMON_UNITS.some(
    (u) =>
      u.toLowerCase() ===
      String(value || "")
        .trim()
        .toLowerCase(),
  );
  const [customMode, setCustomMode] = useState(Boolean(value) && !isKnown);

  useEffect(() => {
    if (!value) return;
    const match = COMMON_UNITS.some(
      (u) => u.toLowerCase() === String(value).trim().toLowerCase(),
    );
    if (!match) {
      setCustomMode(true);
    }
  }, [value]);

  const baseClass = compact
    ? "w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
    : "w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]";

  if (customMode) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="gram / butir / ml"
          className={`${baseClass} ${className}`}
        />
        <button
          type="button"
          onClick={() => {
            setCustomMode(false);
            onChange("gram");
          }}
          className="text-[11px] font-bold text-[#1D7AFC] hover:underline"
        >
          Pilih dari daftar satuan
        </button>
      </div>
    );
  }

  return (
    <select
      value={value || ""}
      required
      onChange={(e) => {
        if (e.target.value === "__CUSTOM__") {
          setCustomMode(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
      className={`${baseClass} ${className}`}
    >
      <option value="" disabled>
        Pilih satuan
      </option>
      {COMMON_UNITS.map((unitOpt) => (
        <option key={unitOpt} value={unitOpt}>
          {unitOpt}
        </option>
      ))}
      <option value="__CUSTOM__">+ Ketik satuan lainnya...</option>
    </select>
  );
}
