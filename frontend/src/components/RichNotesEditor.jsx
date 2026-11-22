"use client";

import { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
} from "lucide-react";

export default function RichNotesEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const applyFormat = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const buttons = [
    { cmd: "bold", icon: Bold, label: "Bold" },
    { cmd: "italic", icon: Italic, label: "Italic" },
    { cmd: "underline", icon: Underline, label: "Underline" },
    { cmd: "justifyLeft", icon: AlignLeft, label: "Align Left" },
    { cmd: "justifyCenter", icon: AlignCenter, label: "Align Center" },
    { cmd: "justifyRight", icon: AlignRight, label: "Align Right" },
    { cmd: "justifyFull", icon: AlignJustify, label: "Justify" },
    { cmd: "insertUnorderedList", icon: List, label: "Bullet List" },
    { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered List" },
  ];

  return (
    <div className="rounded-2xl border border-slate-300 bg-white overflow-hidden focus-within:border-[#0369A1] focus-within:ring-2 focus-within:ring-[#0369A1]/15">
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
        {buttons.map((btn) => (
          <button
            key={btn.cmd}
            type="button"
            title={btn.label}
            onMouseDown={(e) => {
              e.preventDefault();
              applyFormat(btn.cmd);
            }}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 transition-colors"
          >
            <btn.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        className="rich-notes min-h-[125px] p-3.5 text-sm text-slate-800 focus:outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
      />
    </div>
  );
}
