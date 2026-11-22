"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  PackagePlus,
  AlertCircle,
  X,
} from "lucide-react";
import api from "../../../api/axios";
import {
  formatQty,
  isDiscreteUnit,
  getDaysUntilExpiry,
  formatDateDisplay,
  getIngredientAlertStatus,
} from "../../../utils/formatters";
import UnitSelect from "../../../components/UnitSelect";
import {
  ConfirmModal,
  ToastNotification,
} from "../../../components/ConfirmModal";

const CATEGORIES = [
  "Semua",
  "Protein",
  "Sayuran & Buah",
  "Dairy & Telur",
  "Tepung & Kering",
  "Bumbu & Saus",
  "Lainnya",
];

function IngredientsContent() {
  const searchParams = useSearchParams();

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [bannerError, setBannerError] = useState("");
  const [toast, setToast] = useState({ type: "", text: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Protein",
    qty: "",
    unit: "gram",
    min_qty: "",
    expiry_date: "",
  });

  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockNotes, setRestockNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const fetchIngredients = async () => {
    try {
      const res = await api.get("/ingredients");
      setIngredients(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setBannerError("");
    setFormData({
      name: "",
      category: "Protein",
      qty: "",
      unit: "gram",
      min_qty: "100",
      expiry_date: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setBannerError("");
    setFormData({
      name: item.name,
      category: item.category || "Lainnya",
      qty: formatQty(item.qty),
      unit: item.unit,
      min_qty: formatQty(item.min_qty),
      expiry_date: item.expiry_date
        ? String(item.expiry_date).split("T")[0]
        : "",
    });
    setModalOpen(true);
  };

  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    setBannerError("");
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        qty: Number(formData.qty),
        min_qty: Number(formData.min_qty),
        expiry_date: formData.expiry_date || null,
      };
      if (editingItem) {
        await api.put(`/ingredients/${editingItem.id}`, payload);
        setToast({
          type: "success",
          text: `Bahan "${formData.name}" berhasil diperbarui.`,
        });
      } else {
        await api.post("/ingredients", payload);
        setToast({
          type: "success",
          text: `Bahan "${formData.name}" berhasil ditambahkan.`,
        });
      }
      setModalOpen(false);
      fetchIngredients();
    } catch (err) {
      setBannerError(
        err.response?.data?.message || "Gagal menyimpan bahan baku.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockModal) return;
    setBannerError("");
    setSubmitting(true);
    try {
      await api.post(`/ingredients/${restockModal.id}/restock`, {
        qty_added: Number(restockQty),
        notes: restockNotes,
      });
      setToast({
        type: "success",
        text: `Stok ${restockModal.name} berhasil ditambahkan.`,
      });
      setRestockModal(null);
      setRestockQty("");
      setRestockNotes("");
      fetchIngredients();
    } catch (err) {
      setBannerError(err.response?.data?.message || "Gagal melakukan restock.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteIngredient = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/ingredients/${deleteTarget.id}`);
      setToast({
        type: "success",
        text: `Bahan "${deleteTarget.name}" telah dihapus.`,
      });
      fetchIngredients();
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Gagal menghapus bahan.",
      });
    }
  };

  const filteredIngredients = ingredients.filter((item) => {
    const matchCat =
      selectedCategory === "Semua" || item.category === selectedCategory;
    const matchSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getExpiryBadge = (expiryDate) => {
    const diffDays = getDaysUntilExpiry(expiryDate);
    if (diffDays === null) return null;
    if (diffDays < 0) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
          Kedaluwarsa
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
          Kedaluwarsa Hari Ini
        </span>
      );
    }
    if (diffDays <= 5) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
          H-{diffDays}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
        {formatDateDisplay(expiryDate, "id")}
      </span>
    );
  };

  const discreteSelected = isDiscreteUnit(formData.unit);

  return (
    <div className="space-y-6">
      <ToastNotification
        toast={toast}
        onClose={() => setToast({ type: "", text: "" })}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        variant="danger"
        title="Hapus Bahan Baku"
        message={`Hapus bahan "${deleteTarget?.name || ""}" dari inventaris dapur?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={confirmDeleteIngredient}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            Inventaris Bahan Baku
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Kelola stok, batas minimum, dan tanggal kedaluwarsa bahan dapur.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full blue-gradient-btn text-white text-sm font-bold shadow-blueglow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Bahan</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-sky-50 border border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama bahan..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-full text-xs text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-slate-500">
          Memuat daftar bahan baku...
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-card">
          <p className="text-base font-extrabold text-slate-950">
            Belum ada bahan baku
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Tambahkan bahan baku pertama Anda untuk mulai memantau stok.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-full blue-gradient-btn text-white text-xs font-bold shadow-blueglow"
          >
            + Tambah Bahan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredIngredients.map((item) => {
            const alertStatus = getIngredientAlertStatus(item);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 border shadow-card hover:shadow-soft transition-all flex flex-col justify-between ${
                  alertStatus.isCritical
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200/90"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-950 text-white text-[11px] font-bold mb-1.5">
                        {item.category || "Lainnya"}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-950">
                        {item.name}
                      </h3>
                    </div>
                    {getExpiryBadge(item.expiry_date)}
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">
                        Stok Tersedia
                      </p>
                      <p
                        className={`text-xl font-extrabold ${
                          alertStatus.isLowStock
                            ? "text-red-600"
                            : "text-slate-950"
                        }`}
                      >
                        {formatQty(item.qty)}{" "}
                        <span className="text-xs font-bold text-slate-600">
                          {item.unit}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-slate-500">
                        Stok Minimum
                      </p>
                      <p className="text-xs font-bold text-slate-700">
                        {formatQty(item.min_qty)} {item.unit}
                      </p>
                    </div>
                  </div>

                  {alertStatus.isLowStock && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Stok menipis, segera restock</span>
                    </div>
                  )}

                  {(alertStatus.isExpired || alertStatus.isExpiringSoon) && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Mendekati atau melewati kedaluwarsa</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setBannerError("");
                      setRestockModal(item);
                      setRestockQty("");
                      setRestockNotes("");
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full blue-gradient-btn text-white text-xs font-bold shadow-2xs transition-all"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Restock</span>
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL ADD / EDIT INGREDIENT */}
      {modalOpen && (
        <div className="fixed inset-0 !mt-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-950">
                {editingItem ? "Edit Bahan Baku" : "Tambah Bahan"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bannerError && (
              <div className="mb-4 flex items-start gap-2 text-red-700 text-xs font-semibold bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{bannerError}</span>
              </div>
            )}

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Bahan
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Telur Ayam Negeri"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 bg-white focus:outline-none focus:border-[#1D7AFC]"
                >
                  {CATEGORIES.filter((c) => c !== "Semua").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    step={discreteSelected ? "1" : "0.01"}
                    min="0"
                    required
                    value={formData.qty}
                    onChange={(e) =>
                      setFormData({ ...formData, qty: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Satuan
                  </label>
                  <UnitSelect
                    value={formData.unit}
                    onChange={(nextUnit) =>
                      setFormData({ ...formData, unit: nextUnit })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    step={discreteSelected ? "1" : "0.01"}
                    min="0"
                    required
                    value={formData.min_qty}
                    onChange={(e) =>
                      setFormData({ ...formData, min_qty: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tanggal Kedaluwarsa
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiry_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                  />
                </div>
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
                  {submitting ? "Menyimpan..." : "Simpan Bahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESTOCK */}
      {restockModal && (
        <div className="fixed inset-0 !mt-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-slate-950">
                Restock {restockModal.name}
              </h2>
              <button
                onClick={() => setRestockModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Stok Tersedia:{" "}
              <strong className="text-slate-950">
                {formatQty(restockModal.qty)} {restockModal.unit}
              </strong>
            </p>

            {bannerError && (
              <div className="mb-3 flex items-start gap-2 text-red-700 text-xs font-semibold bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{bannerError}</span>
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Jumlah Tambahan ({restockModal.unit})
                </label>
                <input
                  type="number"
                  step={isDiscreteUnit(restockModal.unit) ? "1" : "0.01"}
                  min={isDiscreteUnit(restockModal.unit) ? "1" : "0.01"}
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="Contoh: 10"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Belanja pagi"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full blue-gradient-btn text-white text-xs font-bold shadow-blueglow"
              >
                {submitting ? "..." : "Konfirmasi Restock"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IngredientsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Memuat...
        </div>
      }
    >
      <IngredientsContent />
    </Suspense>
  );
}
