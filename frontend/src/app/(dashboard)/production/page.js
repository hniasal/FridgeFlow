"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Factory,
  CheckCircle2,
  XCircle,
  Play,
  Minus,
  Plus,
  Search,
  ArrowUpRight,
  ChefHat,
} from "lucide-react";
import api from "../../../api/axios";
import { formatQty } from "../../../utils/formatters";
import {
  ConfirmModal,
  ToastNotification,
} from "../../../components/ConfirmModal";

const cleanNumber = (val) => {
  const num = Number(val);
  return Number.isInteger(num) ? num : Number(num.toFixed(2));
};

export default function ProductionPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState({});
  const [producingId, setProducingId] = useState(null);
  const [produceTarget, setProduceTarget] = useState(null);
  const [toast, setToast] = useState({ type: "", text: "" });

  const fetchActiveRecipes = async () => {
    try {
      const res = await api.get("/recipes");
      const all = res.data.data || [];
      // Hanya tampilkan resep yang aktif (tidak diarsipkan)
      const activeOnly = all.filter((r) => !r.is_archived);
      setRecipes(activeOnly);
      setQuantities((prev) => {
        const next = { ...prev };
        for (const r of activeOnly) {
          if (!next[r.id] || next[r.id] < 1) {
            next[r.id] = 1;
          }
        }
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRecipes();
  }, []);

  const getTargetQty = (recipeId) => {
    const val = Number(quantities[recipeId]);
    return Number.isInteger(val) && val >= 1 ? val : 1;
  };

  const setTargetQty = (recipeId, rawVal) => {
    if (rawVal === "") {
      setQuantities((prev) => ({ ...prev, [recipeId]: "" }));
      return;
    }
    const parsed = Math.max(1, Math.floor(Number(rawVal) || 1));
    setQuantities((prev) => ({ ...prev, [recipeId]: parsed }));
  };

  const normalizeQtyOnBlur = (recipeId) => {
    const current = Number(quantities[recipeId]);
    if (!Number.isInteger(current) || current < 1) {
      setQuantities((prev) => ({ ...prev, [recipeId]: 1 }));
    }
  };

  const confirmProduce = async () => {
    if (!produceTarget) return;
    const { recipe, quantity } = produceTarget;
    setProducingId(recipe.id);
    try {
      const res = await api.post(`/recipes/${recipe.id}/checkout`, {
        quantity,
      });
      setToast({ type: "success", text: res.data.message });
      await fetchActiveRecipes();
    } catch (err) {
      setToast({
        type: "error",
        text:
          err.response?.data?.message ||
          "Gagal memproses produksi. Pastikan stok bahan baku mencukupi.",
      });
    } finally {
      setProducingId(null);
    }
  };

  const filteredRecipes = recipes.filter((rec) =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ToastNotification
        toast={toast}
        onClose={() => setToast({ type: "", text: "" })}
      />

      <ConfirmModal
        isOpen={Boolean(produceTarget)}
        variant="primary"
        title="Konfirmasi Produksi"
        message={
          produceTarget
            ? `Produksi "${produceTarget.recipe.title}" sebanyak ${produceTarget.quantity} pcs sekarang? Stok bahan baku akan otomatis berkurang sesuai total kebutuhan.`
            : ""
        }
        confirmText="Ya, Produksi Sekarang"
        cancelText="Batal"
        onConfirm={confirmProduce}
        onClose={() => setProduceTarget(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            Produksi Harian
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Tentukan jumlah yang akan diproduksi, cek kecukupan stok bahan baku,
            dan potong stok secara otomatis.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu produksi..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-full text-xs text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-slate-500">
          Memeriksa ketersediaan stok untuk produksi...
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-card">
          <ChefHat className="w-12 h-12 text-[#1D7AFC] mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-950">
            Belum Ada Menu Produksi Tersedia
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md mx-auto">
            Daftar produksi diambil otomatis dari resep yang aktif. Buat resep
            baru atau pulihkan resep yang diarsipkan pada menu Resep.
          </p>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full blue-gradient-btn text-white text-xs font-bold shadow-blueglow"
          >
            <span>Buka Menu Resep</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRecipes.map((recipe) => {
            const rawInput = quantities[recipe.id];
            const targetQty = getTargetQty(recipe.id);

            const evaluatedIngredients = (recipe.ingredients || []).map(
              (ing) => {
                const totalNeeded = cleanNumber(
                  Number(ing.qty_needed) * targetQty,
                );
                const available = cleanNumber(Number(ing.stock_available));
                const isEnough =
                  Boolean(ing.is_registered_stock) && available >= totalNeeded;
                const shortage = isEnough
                  ? 0
                  : cleanNumber(totalNeeded - available);

                return {
                  ...ing,
                  totalNeeded,
                  available,
                  isEnough,
                  shortage,
                };
              },
            );

            const canProduce =
              targetQty >= 1 &&
              evaluatedIngredients.length > 0 &&
              evaluatedIngredients.every((item) => item.isEnough);

            return (
              <div
                key={recipe.id}
                className={`rounded-3xl p-6 bg-white border shadow-card hover:shadow-soft transition-all flex flex-col justify-between ${
                  canProduce
                    ? "border-sky-300 ring-1 ring-sky-200/70"
                    : "border-red-200"
                }`}
              >
                <div>
                  {/* Header Produksi */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          canProduce
                            ? "blue-gradient-card text-white shadow-blueglow"
                            : "bg-slate-950 text-white"
                        }`}
                      >
                        <Factory className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          {evaluatedIngredients.length} Bahan Baku
                        </p>
                        <h3 className="text-xl font-extrabold text-slate-950 leading-tight">
                          {recipe.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Kontrol Jumlah yang Akan Diproduksi */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-900">
                          Jumlah yang Akan Diproduksi
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Atur target jumlah produksi (pcs / porsi)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setTargetQty(recipe.id, Math.max(1, targetQty - 1))
                          }
                          className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-900 flex items-center justify-center font-bold"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={rawInput === "" ? "" : targetQty}
                          onChange={(e) =>
                            setTargetQty(
                              recipe.id,
                              e.target.value.replace(/[^0-9]/g, ""),
                            )
                          }
                          onBlur={() => normalizeQtyOnBlur(recipe.id)}
                          className="w-20 px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-center text-sm font-extrabold text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                        />
                        <button
                          type="button"
                          onClick={() => setTargetQty(recipe.id, targetQty + 1)}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-900 flex items-center justify-center font-bold"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tombol Cepat Jumlah Produksi */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">
                        Pilih cepat:
                      </span>
                      {[1, 10, 50, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTargetQty(recipe.id, preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            targetQty === preset
                              ? "bg-slate-950 text-white"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-sky-50"
                          }`}
                        >
                          {preset} pcs
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Kesiapan Produksi */}
                  <div className="mb-4">
                    {canProduce ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Stok Tersedia &bull; Siap Produksi ({targetQty} pcs)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Bahan Tidak Mencukupi untuk {targetQty} pcs
                      </span>
                    )}
                  </div>

                  {/* Rincian Kecukupan & Kekurangan Bahan Baku */}
                  <div className="rounded-2xl p-4 space-y-2.5 mb-5 bg-[#F8FAFC] border border-slate-200/80">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Kebutuhan Bahan Baku ({targetQty} pcs):
                    </p>
                    {evaluatedIngredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-slate-950">
                          {ing.ingredient_name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-700">
                            Butuh{" "}
                            <strong className="text-slate-950">
                              {formatQty(ing.totalNeeded)} {ing.unit}
                            </strong>{" "}
                            {ing.is_registered_stock
                              ? `(Stok: ${formatQty(ing.available)} ${ing.unit})`
                              : ""}
                          </span>
                          {!ing.is_registered_stock ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                              Belum ada di stok (butuh{" "}
                              {formatQty(ing.totalNeeded)} {ing.unit})
                            </span>
                          ) : (
                            !ing.isEnough && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold">
                                Butuh {formatQty(ing.shortage)} {ing.unit} lagi
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tombol Eksekusi Produksi */}
                <button
                  type="button"
                  disabled={!canProduce || producingId === recipe.id}
                  onClick={() =>
                    setProduceTarget({ recipe, quantity: targetQty })
                  }
                  className={`w-full py-3.5 px-5 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    canProduce
                      ? "blue-gradient-btn text-white shadow-blueglow"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {producingId === recipe.id
                      ? "Memproses Produksi..."
                      : canProduce
                        ? `Produksi ${targetQty} pcs Sekarang`
                        : `Stok Tidak Mencukupi (${targetQty} pcs)`}
                  </span>
                  {canProduce && <ArrowUpRight className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
