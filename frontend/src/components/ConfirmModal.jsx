"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "primary",
  onConfirm,
  onClose,
}) {
  if (!isOpen || typeof document === "undefined") return null;

  const isDanger = variant === "danger";

  return createPortal(
    <div className="fixed inset-0 !mt-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDanger
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-sky-50 text-[#1D7AFC] border border-sky-200"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-950">{title}</h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
            className={`rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "blue-gradient-btn shadow-blueglow"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast?.text) return;
    const timer = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast?.text || typeof document === "undefined") return null;

  const isError = toast.type === "error";

  return createPortal(
    <div
      role="status"
      className={`fixed right-5 top-5 !mt-0 z-[10000] flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-xl ${
        isError
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-900"
      }`}
    >
      {isError ? (
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      )}
      <p className="text-xs font-bold leading-snug flex-1">{toast.text}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body
  );
}
