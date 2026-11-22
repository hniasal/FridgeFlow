"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ChefHat,
  Factory,
  ArrowLeftRight,
  Sparkles,
  Search,
  LogOut,
  Menu,
  X,
  Snowflake,
  Bell,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatQty, getIngredientAlertStatus } from "../utils/formatters";
import StockAlertPopup from "./StockAlertPopup";

export default function DashboardShell({ children }) {
  const { user, isAuthenticated, loadingAuth, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const [allIngredients, setAllIngredients] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [alertPopupOpen, setAlertPopupOpen] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!loadingAuth && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loadingAuth, isAuthenticated, router]);

  const fetchSearchAndAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [ingRes, recRes] = await Promise.all([
        api.get("/ingredients"),
        api.get("/recipes"),
      ]);
      setAllIngredients(ingRes.data.data || []);
      setAllRecipes(recRes.data.data || []);
    } catch {
      // Silent fallback
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSearchAndAlerts();
  }, [fetchSearchAndAlerts, pathname]);

  const criticalItems = useMemo(
    () =>
      allIngredients
        .map((item) => ({
          ...item,
          status: getIngredientAlertStatus(item),
        }))
        .filter((item) => item.status.isCritical),
    [allIngredients],
  );

  const searchKeyword = globalSearch.trim().toLowerCase();

  const matchedIngredients = useMemo(() => {
    if (!searchKeyword) return [];
    return allIngredients
      .filter((item) => item.name.toLowerCase().includes(searchKeyword))
      .slice(0, 5);
  }, [allIngredients, searchKeyword]);

  const matchedRecipes = useMemo(() => {
    if (!searchKeyword) return [];
    return allRecipes
      .filter(
        (rec) =>
          !rec.is_archived && rec.title.toLowerCase().includes(searchKeyword),
      )
      .slice(0, 5);
  }, [allRecipes, searchKeyword]);

  if (loadingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center sky-atmosphere">
        <div className="flex flex-col items-center gap-3 bg-white px-8 py-6 rounded-3xl border border-slate-200 shadow-soft">
          <div className="w-9 h-9 border-4 border-[#1D7AFC] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-800">
            Memuat Ruang Kerja FridgeFlow...
          </p>
        </div>
      </div>
    );
  }

  const mainNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ingredients", label: "Bahan Baku", icon: Package },
    { href: "/recipes", label: "Resep", icon: ChefHat },
    { href: "/production", label: "Produksi", icon: Factory },
    {
      href: "/transactions",
      label: "Riwayat Stok",
      icon: ArrowLeftRight,
    },
  ];

  const toolsNav = [
    { href: "/ai-chef", label: "Resep Menu Cerdas", icon: Sparkles },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;
    setSearchDropdownOpen(false);
    if (matchedRecipes.length > 0 && matchedIngredients.length === 0) {
      router.push(`/recipes?q=${encodeURIComponent(q)}`);
    } else {
      router.push(`/ingredients?q=${encodeURIComponent(q)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const openDeleteModal = async () => {
    setSidebarOpen(false);
    setDeleteInput("");
    setDeleteError("");
    setDeleteModalOpen(true);

    try {
      const res = await api.get("/auth/me");
      if (typeof res.data?.data?.has_password === "boolean") {
        setHasPassword(res.data.data.has_password);
      }
    } catch {
      setHasPassword(true);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError("");
    setDeletingAccount(true);

    try {
      await api.delete("/auth/delete-account", {
        data: hasPassword
          ? { password: deleteInput }
          : { confirmText: deleteInput },
      });

      setDeleteModalOpen(false);
      logout();
      router.replace("/");
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          "Gagal menghapus akun. Silakan periksa kembali konfirmasi Anda.",
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const navLinkClass = (href) => {
    const isActive = pathname === href;
    return `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
      isActive
        ? "blue-gradient-btn text-white shadow-blueglow"
        : "text-slate-700 hover:bg-sky-50/80 hover:text-slate-950"
    }`;
  };

  return (
    <div className="min-h-screen bg-[#F4F8FC] flex">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/45 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-5 shadow-card lg:shadow-none transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-2 mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl blue-gradient-card flex items-center justify-center text-white shadow-blueglow">
                <Snowflake className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-950">
                  FRIDGE<span className="text-[#1D7AFC]">FLOW</span>
                </span>
                <p className="text-[11px] font-semibold text-slate-500 -mt-1">
                  Smart Warehouse &amp; Inventory
                </p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Menu Utama
            </p>
            <nav className="space-y-1.5">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={navLinkClass(item.href)}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Asisten Menu
            </p>
            <nav className="space-y-1.5">
              {toolsNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={navLinkClass(item.href)}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="bg-slate-950 text-white rounded-2xl p-3.5 mb-3 shadow-sm">
            <p className="text-xs font-extrabold truncate">
              {user?.name || "Pengguna"}
            </p>
            <p className="text-[11px] text-slate-300 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/70 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
          <button
            type="button"
            onClick={openDeleteModal}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-slate-500 hover:text-red-700 hover:bg-red-50/70 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Akun</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 py-3.5 px-5 sm:px-8 bg-gradient-to-r from-[#DCEEFF]/90 via-white/95 to-[#EBF5FF]/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={globalSearch}
                  onFocus={() => {
                    fetchSearchAndAlerts();
                    setSearchDropdownOpen(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setSearchDropdownOpen(false), 200)
                  }
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setSearchDropdownOpen(true);
                  }}
                  placeholder="Cari bahan baku atau resep..."
                  className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-full text-sm text-slate-950 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-[#1D7AFC] focus:ring-2 focus:ring-[#1D7AFC]/15"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {searchDropdownOpen && searchKeyword && (
                <div className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                  {matchedIngredients.length === 0 &&
                  matchedRecipes.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs font-semibold text-slate-500">
                      Tidak ada bahan baku atau resep yang cocok.
                    </p>
                  ) : (
                    <>
                      {matchedIngredients.length > 0 && (
                        <div className="mb-2">
                          <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Bahan Baku
                          </p>
                          {matchedIngredients.map((item) => {
                            const status = getIngredientAlertStatus(item);
                            return (
                              <button
                                key={`ing-${item.id}`}
                                type="button"
                                onMouseDown={() => {
                                  setSearchDropdownOpen(false);
                                  router.push(
                                    `/ingredients?q=${encodeURIComponent(
                                      item.name,
                                    )}`,
                                  );
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-sky-50 transition-colors"
                              >
                                <span className="flex items-center gap-2 font-bold text-slate-950">
                                  <Package
                                    className={`h-3.5 w-3.5 ${
                                      status.isCritical
                                        ? "text-red-600"
                                        : "text-[#1D7AFC]"
                                    }`}
                                  />
                                  <span>{item.name}</span>
                                </span>
                                <span
                                  className={`font-bold ${
                                    status.isCritical
                                      ? "text-red-600"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {formatQty(item.qty)} {item.unit}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {matchedRecipes.length > 0 && (
                        <div>
                          <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Resep
                          </p>
                          {matchedRecipes.map((rec) => (
                            <button
                              key={`rec-${rec.id}`}
                              type="button"
                              onMouseDown={() => {
                                setSearchDropdownOpen(false);
                                router.push(
                                  `/recipes?q=${encodeURIComponent(rec.title)}`,
                                );
                              }}
                              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-sky-50 transition-colors"
                            >
                              <span className="flex items-center gap-2 font-bold text-slate-950">
                                <ChefHat className="h-3.5 w-3.5 text-[#1D7AFC]" />
                                <span>{rec.title}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950 text-white">
                                {rec.ingredients?.length || 0} Bahan
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setAlertPopupOpen((prev) => !prev)}
              className={`relative p-2 rounded-full border transition-colors ${
                criticalItems.length > 0
                  ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Peringatan Bahan Baku Kritis"
            >
              <Bell className="w-4 h-4" />
              {criticalItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white">
                  {criticalItems.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
              <div className="w-7 h-7 rounded-full blue-gradient-card text-white font-bold text-xs flex items-center justify-center uppercase">
                {user?.name?.charAt(0) || "F"}
              </div>
              <span className="hidden sm:inline text-xs font-extrabold text-slate-950">
                {user?.name?.split(" ")[0] || "User"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <StockAlertPopup
        criticalItems={criticalItems}
        isOpen={alertPopupOpen}
        onClose={() => setAlertPopupOpen(false)}
      />

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-soft">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-950">
                  Hapus Akun Permanen
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  Tindakan ini tidak dapat dibatalkan. Seluruh data stok bahan,
                  resep, dan riwayat transaksi Anda akan dihapus permanen.
                </p>
              </div>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {hasPassword
                    ? "Masukkan kata sandi Anda untuk konfirmasi"
                    : 'Ketik "HAPUS" untuk mengonfirmasi'}
                </label>
                <input
                  type={hasPassword ? "password" : "text"}
                  required
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={
                    hasPassword ? "Kata sandi saat ini" : "Ketik HAPUS"
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                />
              </div>

              {deleteError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || !deleteInput.trim()}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingAccount ? "Menghapus..." : "Ya, Hapus Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
