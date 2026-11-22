"use client";

import { useState, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
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
    <Select.Root
      required
      value={value || undefined}
      onValueChange={(selected) => {
        if (selected === "__CUSTOM__") {
          setCustomMode(true);
          onChange("");
        } else {
          onChange(selected);
        }
      }}
    >
      <Select.Trigger
        className={`${baseClass} inline-flex items-center justify-between gap-2 text-left data-[placeholder]:text-slate-400 ${className}`}
      >
        <Select.Value placeholder="Pilih satuan" />
        <Select.Icon>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-[10000] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
        >
          <Select.Viewport className="max-h-56 overflow-y-auto p-1">
            {COMMON_UNITS.map((unitOpt) => (
              <Select.Item
                key={unitOpt}
                value={unitOpt}
                className="relative flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none data-[highlighted]:bg-sky-50 data-[highlighted]:text-[#1D7AFC]"
              >
                <Select.ItemText>{unitOpt}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="h-3.5 w-3.5 text-[#1D7AFC]" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}

            <Select.Separator className="my-1 h-px bg-slate-100" />

            <Select.Item
              value="__CUSTOM__"
              className="relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-xs font-bold text-[#1D7AFC] outline-none data-[highlighted]:bg-sky-50"
            >
              <Select.ItemText>+ Ketik satuan lainnya...</Select.ItemText>
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
