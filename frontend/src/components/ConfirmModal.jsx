"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Toast from "@radix-ui/react-toast";
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
  const isDanger = variant === "danger";

  return (
    <AlertDialog.Root
      open={Boolean(isOpen)}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[9999] bg-slate-900/55 backdrop-blur-xs" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[10000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl focus:outline-none">
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
              <AlertDialog.Title className="text-base font-extrabold text-slate-950">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                {message}
              </AlertDialog.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {cancelText}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={() => onConfirm?.()}
                className={`rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
                  isDanger
                    ? "bg-red-600 hover:bg-red-700"
                    : "blue-gradient-btn shadow-blueglow"
                }`}
              >
                {confirmText}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function ToastNotification({ toast, onClose }) {
  const isError = toast?.type === "error";

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      <Toast.Root
        open={Boolean(toast?.text)}
        onOpenChange={(open) => {
          if (!open) onClose?.();
        }}
        className={`flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-xl ${
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
        <Toast.Description className="text-xs font-bold leading-snug flex-1">
          {toast?.text}
        </Toast.Description>
        <Toast.Close asChild>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            className="rounded-lg p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className="fixed right-5 top-5 z-[10000] flex max-w-sm flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
