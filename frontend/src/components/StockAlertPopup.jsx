"use client";

import { AlertCircle, X } from "lucide-react";
import { formatQty, formatDateDisplay } from "../utils/formatters";

export default function StockAlertPopup({
  criticalItems = [],
  isOpen,
  onClose,
}) {
  if (!isOpen || criticalItems.length === 0) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm rounded-3xl border-2 border-red-300 bg-red-50 p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-red-700">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-red-700">
              Peringatan Bahan Baku Kritis
            </h4>
            <p className="text-[11px] font-semibold text-red-600">
              {criticalItems.length} bahan memerlukan tindakan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pemberitahuan"
          className="rounded-full p-1.5 text-red-600 hover:bg-red-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-3 max-h-44 space-y-1.5 overflow-y-auto pr-1 text-xs">
        {criticalItems.map((item) => {
          const { status } = item;
          const reasons = [];
          if (status.isExpired) {
            reasons.push(
              `Kedaluwarsa (${formatDateDisplay(item.expiry_date)})`,
            );
          } else if (status.isExpiringSoon) {
            reasons.push(
              status.daysLeft === 0
                ? "Expired hari ini"
                : `Hampir kedaluwarsa (H-${status.daysLeft})`,
            );
          }
          if (status.isLowStock) {
            reasons.push(`Stok menipis (${formatQty(item.qty)} ${item.unit})`);
          }

          return (
            <li
              key={item.id}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-red-700 shadow-2xs"
            >
              <p className="font-extrabold text-red-800">{item.name}</p>
              <p className="text-[11px] font-semibold text-red-600 mt-0.5">
                {reasons.join(" • ")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
