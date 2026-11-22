"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  ChefHat,
  Trash2,
  Edit3,
  Eye,
  Archive,
  ArchiveRestore,
  X,
  AlertCircle,
  Search,
} from "lucide-react";
import api from "../../../api/axios";
import { formatQty, isDiscreteUnit } from "../../../utils/formatters";
import RichNotesEditor from "../../../components/RichNotesEditor";
import UnitSelect from "../../../components/UnitSelect";
import {
  ConfirmModal,
  ToastNotification,
} from "../../../components/ConfirmModal";

function RecipesContent() {
  const searchParams = useSearchParams();

  const [recipes, setRecipes] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState("active"); // "active" | "archived"

  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecipeModal, setViewRecipeModal] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [toast, setToast] = useState({ type: "", text: "" });
  const [modalError, setModalError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customUnit, setCustomUnit] = useState("gram");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [recRes, ingRes] = await Promise.all([
        api.get("/recipes"),
        api.get("/ingredients"),
      ]);
      setRecipes(recRes.data.data || []);
      setIngredientsList(ingRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingRecipe(null);
    setModalError("");
    setTitle("");
    setInstructions("");
    setSelectedItems([]);
    setCustomName("");
    setCustomQty("1");
    setCustomUnit("gram");
    setModalOpen(true);
  };

  const openEditModal = (recipe) => {
    setEditingRecipe(recipe);
    setModalError("");
    setTitle(recipe.title);
    setInstructions(recipe.instructions || "");
    setSelectedItems(
      (recipe.ingredients || []).map((item, idx) => ({
        key: item.ingredient_id
          ? `stock-${item.ingredient_id}`
          : `custom-${item.id || idx}`,
        ingredient_id: item.ingredient_id || null,
        custom_name: item.ingredient_id ? null : item.ingredient_name,
        name: item.ingredient_name,
        qty_needed: formatQty(item.qty_needed),
        unit: item.unit,
      })),
    );
    setCustomName("");
    setCustomQty("1");
    setCustomUnit("gram");
    setModalOpen(true);
  };

  const toggleStockIngredient = (ing) => {
    const key = `stock-${ing.id}`;
    const exists = selectedItems.find((x) => x.key === key);
    if (exists) {
      setSelectedItems(selectedItems.filter((x) => x.key !== key));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          key,
          ingredient_id: ing.id,
          custom_name: null,
          name: ing.name,
          qty_needed: 1,
          unit: ing.unit,
        },
      ]);
    }
  };

  const handleAddCustomIngredient = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const parsedInt = Math.max(1, Math.floor(Number(customQty) || 1));

    const matchedStock = ingredientsList.find(
      (i) => i.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (matchedStock) {
      const key = `stock-${matchedStock.id}`;
      if (!selectedItems.some((x) => x.key === key)) {
        setSelectedItems([
          ...selectedItems,
          {
            key,
            ingredient_id: matchedStock.id,
            custom_name: null,
            name: matchedStock.name,
            qty_needed: parsedInt,
            unit: matchedStock.unit,
          },
        ]);
      }
    } else {
      const key = `custom-${Date.now()}`;
      setSelectedItems([
        ...selectedItems,
        {
          key,
          ingredient_id: null,
          custom_name: trimmed,
          name: trimmed,
          qty_needed: parsedInt,
          unit: customUnit.trim() || "gram",
        },
      ]);
    }

    setCustomName("");
    setCustomQty("1");
  };

  const updateItemQty = (key, qty) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.key === key ? { ...item, qty_needed: qty } : item,
      ),
    );
  };

  const removeSelectedItem = (key) => {
    setSelectedItems(selectedItems.filter((item) => item.key !== key));
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    setModalError("");
    if (selectedItems.length === 0) {
      setModalError("Tambahkan minimal 1 bahan untuk resep ini.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        instructions,
        ingredients: selectedItems.map((item) => ({
          ingredient_id: item.ingredient_id || null,
          custom_name: item.ingredient_id
            ? null
            : item.custom_name || item.name,
          qty_needed: Number(item.qty_needed),
          unit: item.unit,
        })),
      };

      if (editingRecipe) {
        const res = await api.put(`/recipes/${editingRecipe.id}`, payload);
        setToast({ type: "success", text: res.data.message });
      } else {
        const res = await api.post("/recipes", payload);
        setToast({ type: "success", text: res.data.message });
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Gagal menyimpan resep.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (recipe) => {
    setArchivingId(recipe.id);
    try {
      const nextArchived = !recipe.is_archived;
      const res = await api.patch(`/recipes/${recipe.id}/archive`, {
        is_archived: nextArchived,
      });
      setToast({ type: "success", text: res.data.message });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        text:
          err.response?.data?.message || "Gagal mengubah status arsip resep.",
      });
    } finally {
      setArchivingId(null);
    }
  };

  const confirmDeleteRecipe = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/recipes/${deleteTarget.id}`);
      setToast({ type: "success", text: res.data.message });
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Gagal menghapus resep.",
      });
    }
  };

  const activeRecipes = recipes.filter((r) => !r.is_archived);
  const archivedRecipes = recipes.filter((r) => r.is_archived);
  const displayedRecipes = (
    activeTab === "archived" ? archivedRecipes : activeRecipes
  ).filter((rec) =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <ToastNotification
        toast={toast}
        onClose={() => setToast({ type: "", text: "" })}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        variant="danger"
        title="Konfirmasi Hapus"
        message={`Hapus resep "${deleteTarget?.title || ""}" dari buku resep Anda? Resep ini juga akan hilang dari daftar Produksi.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={confirmDeleteRecipe}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            Buku Resep
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Tulis dan simpan standar takaran resep (default 1 resep) beserta
            langkah pembuatannya.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full blue-gradient-btn text-white text-sm font-bold shadow-blueglow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Resep Baru</span>
        </button>
      </div>

      {/* Tabs Aktif / Diarsipkan & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "active"
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-sky-50"
            }`}
          >
            Resep Aktif ({activeRecipes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "archived"
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-sky-50"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Diarsipkan ({archivedRecipes.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter nama resep..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-full text-xs text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-slate-500">
          Memuat daftar resep...
        </div>
      ) : displayedRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-card">
          <ChefHat className="w-12 h-12 text-[#1D7AFC] mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-950">
            {activeTab === "archived"
              ? "Belum Ada Resep yang Diarsipkan"
              : "Belum Ada Resep Aktif"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {activeTab === "archived"
              ? "Resep yang diarsipkan akan tersimpan di sini dan disembunyikan sementara dari halaman Produksi."
              : "Buat resep pertama Anda lengkap dengan bahan dan langkah pembuatannya."}
          </p>
          {activeTab === "active" && (
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-full blue-gradient-btn text-white text-xs font-bold shadow-blueglow"
            >
              + Buat Resep Baru
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`rounded-3xl p-6 bg-white border shadow-card hover:shadow-soft transition-all flex flex-col justify-between ${
                recipe.is_archived
                  ? "border-slate-300 bg-slate-50/60"
                  : "border-slate-200/90"
              }`}
            >
              <div>
                {/* Header Resep */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl blue-gradient-card text-white flex items-center justify-center shrink-0 shadow-blueglow">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">
                          {recipe.ingredients?.length || 0} Bahan
                        </span>
                        {recipe.is_archived && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                            Diarsipkan
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-950 leading-tight">
                        {recipe.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!recipe.is_archived && (
                      <button
                        onClick={() => openEditModal(recipe)}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors"
                        title="Edit Resep"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleArchive(recipe)}
                      disabled={archivingId === recipe.id}
                      className="p-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                      title={
                        recipe.is_archived
                          ? "Pulihkan dari Arsip"
                          : "Arsipkan Resep"
                      }
                    >
                      {recipe.is_archived ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(recipe)}
                      className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      title="Hapus Resep"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Daftar Bahan (Maksimal 3 item di tampilan depan) */}
                <div className="rounded-2xl p-4 space-y-2 mb-4 bg-[#F8FAFC] border border-slate-200/80">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Bahan:
                  </p>
                  {(recipe.ingredients || []).slice(0, 3).map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-bold text-slate-950">
                        {ing.ingredient_name}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatQty(ing.qty_needed)} {ing.unit}
                      </span>
                    </div>
                  ))}
                  {(recipe.ingredients?.length || 0) > 3 && (
                    <p className="pt-1 text-[11px] font-bold text-[#1D7AFC]">
                      +{recipe.ingredients.length - 3} bahan lainnya...
                    </p>
                  )}
                </div>

                {/* Langkah Pembuatan */}
                <div className="mb-4 p-3.5 rounded-2xl bg-white border border-slate-200/80">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Langkah Pembuatan:
                  </p>
                  {recipe.instructions ? (
                    <div
                      className="rich-notes text-xs text-slate-700 leading-relaxed line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: recipe.instructions }}
                    />
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Belum ada catatan langkah pembuatan.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Actions: Lihat Resep + Arsip/Pulihkan */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewRecipeModal(recipe)}
                  className="flex-1 py-3 px-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Lihat Resep</span>
                </button>

                <button
                  type="button"
                  disabled={archivingId === recipe.id}
                  onClick={() => handleToggleArchive(recipe)}
                  className="py-3 px-4 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {recipe.is_archived ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Pulihkan Resep</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Arsipkan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIHAT RESEP (DETAIL VIEW - BAHAN & LANGKAH PEMBUATAN) */}
      {viewRecipeModal && (
        <div className="fixed inset-0 !mt-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl blue-gradient-card text-white flex items-center justify-center shadow-blueglow shrink-0">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1D7AFC]">
                    {viewRecipeModal.ingredients?.length || 0} Bahan
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-950">
                    {viewRecipeModal.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setViewRecipeModal(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-slate-200 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Bahan
              </h3>
              <ul className="divide-y divide-slate-200/70">
                {viewRecipeModal.ingredients?.map((ing) => (
                  <li
                    key={ing.id}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-extrabold text-slate-950">
                      {ing.ingredient_name}
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatQty(ing.qty_needed)} {ing.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                Langkah Pembuatan
              </h3>
              {viewRecipeModal.instructions ? (
                <div
                  className="rich-notes p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: viewRecipeModal.instructions,
                  }}
                />
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Belum ada catatan langkah pembuatan untuk resep ini.
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {!viewRecipeModal.is_archived && (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewRecipeModal;
                    setViewRecipeModal(null);
                    openEditModal(target);
                  }}
                  className="flex-1 py-3 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Resep</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewRecipeModal(null)}
                className="flex-1 py-3 px-5 rounded-full blue-gradient-btn text-white text-xs font-extrabold flex items-center justify-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT / EDIT RESEP (DEFAULT 1 PORSI, TANPA HASIL/PRODUKSI & TANPA LABEL STOK) */}
      {modalOpen && (
        <div className="fixed inset-0 !mt-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-950">
                {editingRecipe ? "Edit Resep" : "Buat Resep Baru"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-start gap-2 text-red-700 text-xs font-semibold bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Resep
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Roti Susu Lembut"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                />
              </div>

              {ingredientsList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Pilih dari Daftar Bahan Baku
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                    {ingredientsList.map((ing) => {
                      const key = `stock-${ing.id}`;
                      const selected = selectedItems.find((s) => s.key === key);
                      return (
                        <label
                          key={ing.id}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer ${
                            selected
                              ? "bg-sky-50 border-[#1D7AFC]"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={() => toggleStockIngredient(ing)}
                              className="w-4 h-4 accent-[#1D7AFC] rounded"
                            />
                            <span className="text-xs font-bold text-slate-950">
                              {ing.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Satuan: {ing.unit}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tambah Bahan Lainnya */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  Tambah Bahan Lainnya
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nama bahan (misal: Daun Pandan)"
                    className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                  />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    inputMode="numeric"
                    value={customQty}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                      setCustomQty(digitsOnly);
                    }}
                    placeholder="Jumlah"
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                  />
                  <div className="sm:col-span-3">
                    <UnitSelect
                      compact
                      value={customUnit}
                      onChange={setCustomUnit}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomIngredient}
                    className="sm:col-span-2 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Daftar Bahan dalam Resep ({selectedItems.length})
                  </p>
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200"
                      >
                        <p className="text-xs font-bold text-slate-950 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            step={isDiscreteUnit(item.unit) ? "1" : "0.01"}
                            min={isDiscreteUnit(item.unit) ? "1" : "0.01"}
                            required
                            value={item.qty_needed}
                            onChange={(e) =>
                              updateItemQty(item.key, e.target.value)
                            }
                            className="w-20 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-right text-slate-950"
                          />
                          <span className="text-xs font-semibold text-slate-600 w-12">
                            {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedItem(item.key)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Langkah Pembuatan
                </label>
                <RichNotesEditor
                  value={instructions}
                  onChange={setInstructions}
                  placeholder="Tulis langkah pembuatan, suhu pemanggangan, atau catatan khusus di sini..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-full bg-slate-100 text-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-full blue-gradient-btn text-white text-xs font-bold shadow-blueglow"
                >
                  {submitting ? "Menyimpan..." : "Simpan Resep"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Memuat...
        </div>
      }
    >
      <RecipesContent />
    </Suspense>
  );
}
