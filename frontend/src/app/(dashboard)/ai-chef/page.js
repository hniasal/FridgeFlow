"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChefHat,
  BookmarkPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../../../api/axios";
import { formatQty } from "../../../utils/formatters";

export default function SmartChefPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setGeneratedRecipe(null);
    try {
      const res = await api.post("/ai/generate-recipe", { prompt });
      setGeneratedRecipe(res.data.data);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Gagal membuat rekomendasi resep.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToRecipes = async () => {
    if (!generatedRecipe) return;
    setSaving(true);
    setErrorMsg("");
    try {
      await api.post("/recipes", {
        title: generatedRecipe.title,
        instructions: generatedRecipe.instructions,
        ingredients: generatedRecipe.ingredients.map((item) => ({
          ingredient_id: item.ingredient_id || null,
          custom_name: item.ingredient_id
            ? null
            : item.custom_name || item.ingredient_name,
          qty_needed: Number(item.qty_needed),
          unit: item.unit,
        })),
      });
      router.push("/recipes");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Gagal menyimpan resep ke buku resep.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl p-7 sm:p-8 bg-white border border-slate-200/90 shadow-soft">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950 text-white text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Buat Resep</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mb-2">
          Resep Menu Cerdas
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Dapatkan rekomendasi resep praktis berdasarkan bahan baku yang
          tersedia di dapur Anda saat ini.
        </p>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 text-red-700 text-xs font-semibold bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleGenerate}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Tanya resep hari ini"
            className="flex-1 px-5 py-3.5 rounded-full bg-[#F8FAFC] border border-slate-300 text-slate-950 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#1D7AFC]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3.5 rounded-full blue-gradient-btn text-white font-bold text-sm flex items-center justify-center gap-2 shadow-blueglow transition-all disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "Menyusun..." : "Buat Ide Resep"}</span>
          </button>
        </form>
      </div>

      {generatedRecipe && (
        <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl blue-gradient-card text-white flex items-center justify-center shadow-blueglow">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1D7AFC]">
                  Standar 1 Resep
                </span>
                <h2 className="text-xl font-extrabold text-slate-950">
                  {generatedRecipe.title}
                </h2>
              </div>
            </div>

            <button
              onClick={handleSaveToRecipes}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full blue-gradient-btn text-white text-xs font-bold shadow-blueglow"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>{saving ? "Menyimpan..." : "Simpan ke Buku Resep"}</span>
            </button>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              Komposisi Bahan
            </h3>
            <div className="flex flex-wrap gap-2">
              {generatedRecipe.ingredients?.map((ing, idx) => {
                const isAvailable = ing.is_available !== false;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold ${
                      isAvailable
                        ? "bg-slate-950 text-white"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    {isAvailable ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    )}
                    <span>
                      {ing.ingredient_name}: {formatQty(ing.qty_needed)}{" "}
                      {ing.unit}
                    </span>
                    {!isAvailable && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                        Tidak Tersedia
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Langkah Pembuatan
            </h3>
            <div
              className="rich-notes p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 text-sm text-slate-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: generatedRecipe.instructions }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
