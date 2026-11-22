"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  RefreshCw,
} from "lucide-react";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import {
  formatQty,
  formatDateDisplay,
  getUserTimezoneInfo,
  getIngredientAlertStatus,
} from "../../../utils/formatters";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingInsights, setRefreshingInsights] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const tzInfo = getUserTimezoneInfo();
      const [sumRes, aiRes] = await Promise.all([
        api.get("/transactions/summary", { params: { tz: tzInfo.timeZone } }),
        api.get("/ai/insights"),
      ]);
      setSummary(sumRes.data.data);
      setInsights(aiRes.data.data || []);
    } catch (err) {
      console.error("Gagal memuat ringkasan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefreshInsights = async () => {
    setRefreshingInsights(true);
    try {
      const aiRes = await api.get("/ai/insights");
      setInsights(aiRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-[#1D7AFC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = summary?.stats || {
    totalIngredients: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    totalRecipes: 0,
    readyRecipesCount: 0,
    totalTransactionsWeek: 0,
  };

  const dayMapId = {
    Sun: "Min",
    Mon: "Sen",
    Tue: "Sel",
    Wed: "Rab",
    Thu: "Kam",
    Fri: "Jum",
    Sat: "Sab",
  };

  const weeklyTrends = summary?.weeklyTrends || [
    { day: "Sun", total_activity: 0 },
    { day: "Mon", total_activity: 0 },
    { day: "Tue", total_activity: 0 },
    { day: "Wed", total_activity: 0 },
    { day: "Thu", total_activity: 0 },
    { day: "Fri", total_activity: 0 },
    { day: "Sat", total_activity: 0 },
  ];

  const maxTrend = Math.max(...weeklyTrends.map((d) => d.total_activity), 4);

  const getInsightStyle = (type) => {
    if (type === "expiry") {
      return { bg: "bg-sky-100 text-[#1D7AFC]", icon: Clock };
    }
    if (type === "warning") {
      return { bg: "bg-red-100 text-red-600", icon: AlertTriangle };
    }
    return { bg: "bg-emerald-100 text-emerald-700", icon: Sparkles };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
          Halo, {user?.name?.split(" ")[0] || "Chef"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Ringkasan stok bahan baku dan kesiapan produksi dapur hari ini.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => router.push("/ingredients")}
          className="cursor-pointer group rounded-3xl p-5 bg-white border border-slate-200/90 shadow-card hover:shadow-soft hover:border-[#1D7AFC] transition-all flex flex-col justify-between"
        >
          <div>
            <p className="text-sm font-extrabold text-slate-950">
              Total Bahan Baku
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Item terdaftar di inventaris
            </p>
          </div>
          <div className="flex items-end justify-between mt-6">
            <span className="text-3xl font-extrabold text-slate-950">
              {stats.totalIngredients}
            </span>
            <span className="w-9 h-9 rounded-full bg-slate-950 text-white group-hover:bg-[#1D7AFC] flex items-center justify-center transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div
          onClick={() => router.push("/production")}
          className="cursor-pointer group rounded-3xl p-5 blue-gradient-card text-white shadow-blueglow hover:opacity-95 transition-all flex flex-col justify-between"
        >
          <div>
            <p className="text-sm font-extrabold text-white">
              Resep Siap Masak
            </p>
            <p className="text-xs text-sky-100 mt-0.5">
              Dari total {stats.totalRecipes} resep
            </p>
          </div>
          <div className="flex items-end justify-between mt-6">
            <span className="text-3xl font-extrabold text-white">
              {stats.readyRecipesCount}
            </span>
            <span className="w-9 h-9 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-sm">
              <ArrowUpRight className="w-4 h-4 text-[#1D7AFC]" />
            </span>
          </div>
        </div>

        <div
          onClick={() => router.push("/ingredients")}
          className="cursor-pointer group rounded-3xl p-5 bg-white border border-slate-200/90 shadow-card hover:shadow-soft hover:border-red-400 transition-all flex flex-col justify-between"
        >
          <div>
            <p className="text-sm font-extrabold text-slate-950">
              Stok Perlu Perhatian
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Menipis atau mendekati kedaluwarsa
            </p>
          </div>
          <div className="flex items-end justify-between mt-6">
            <span className="text-3xl font-extrabold text-red-600">
              {stats.attentionCount ??
                stats.lowStockCount + stats.expiringSoonCount}
            </span>
            <span className="w-9 h-9 rounded-full bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Weekly Trends & Kitchen Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Tren Mingguan
              </h2>
              <p className="text-xs text-slate-500">
                Aktivitas transaksi stok 7 hari terakhir
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold">
              7 Hari Terakhir
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end pt-4">
            <div className="sm:col-span-4">
              <p className="text-3xl font-extrabold text-slate-950">
                {stats.totalTransactionsWeek}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Total aktivitas minggu ini
              </p>
            </div>

            <div className="sm:col-span-8 flex items-end justify-between gap-2.5 h-44 pt-6">
              {weeklyTrends.map((item) => {
                const heightPercent =
                  item.total_activity > 0
                    ? Math.max(
                        24,
                        Math.round((item.total_activity / maxTrend) * 100),
                      )
                    : 28;
                const isActive = item.total_activity > 0;
                const displayDay = dayMapId[item.day] || item.day;

                return (
                  <div
                    key={item.day}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 px-2.5 py-1 rounded-full bg-slate-950 text-white text-[10px] font-bold whitespace-nowrap pointer-events-none">
                      {item.total_activity}
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[36px] rounded-full transition-all duration-300 ${
                        isActive
                          ? "blue-gradient-card shadow-blueglow"
                          : "striped-bar opacity-80"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-600">
                      {displayDay}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kitchen Insights */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-950">
              Insight Dapur
            </h2>
            <button
              onClick={handleRefreshInsights}
              disabled={refreshingInsights}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
              title="Muat ulang"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshingInsights ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="space-y-3">
            {insights.map((item, index) => {
              const style = getInsightStyle(item.type);
              const IconComp = style.icon;
              return (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-950">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Priority Ingredients & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-950">
              Bahan Prioritas
            </h2>
            <button
              onClick={() => router.push("/ingredients")}
              className="text-xs font-extrabold text-[#1D7AFC] hover:underline"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          {summary?.criticalIngredients?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                    <th className="pb-3">Bahan Baku</th>
                    <th className="pb-3">Sisa Stok</th>
                    <th className="pb-3">Kedaluwarsa</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {summary.criticalIngredients.map((item) => {
                    const alertStatus = getIngredientAlertStatus(item);
                    let statusLabel = "Stok Menipis";

                    if (
                      alertStatus.isExpired ||
                      item.alert_type === "EXPIRED"
                    ) {
                      statusLabel = "Kedaluwarsa";
                    } else if (
                      alertStatus.isExpiringSoon ||
                      item.alert_type === "EXPIRING"
                    ) {
                      statusLabel = "Segera Kedaluwarsa";
                    }

                    return (
                      <tr key={item.id} className="hover:bg-sky-50/40">
                        <td className="py-3 font-bold text-slate-950">
                          {item.name}
                        </td>
                        <td className="py-3 text-slate-700 font-semibold">
                          {formatQty(item.qty)} {item.unit}
                        </td>
                        <td className="py-3 text-slate-600 text-xs">
                          {formatDateDisplay(item.expiry_date, "id")}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                Semua Stok Aman
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tidak ada bahan yang menipis atau mendekati kedaluwarsa.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-950">
              Aktivitas Terbaru
            </h2>
            <button
              onClick={() => router.push("/transactions")}
              className="text-xs font-extrabold text-[#1D7AFC] hover:underline"
            >
              Semua Log &rarr;
            </button>
          </div>

          {summary?.recentTransactions?.length > 0 ? (
            <div className="space-y-3">
              {summary.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                        tx.type === "IN"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-950 text-white"
                      }`}
                    >
                      {tx.type}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-slate-950 truncate">
                        {tx.ingredient_name || "Bahan Dihapus"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {tx.notes}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-extrabold shrink-0 ml-2 ${
                      tx.type === "IN" ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {tx.type === "IN" ? "+" : "-"}
                    {formatQty(tx.qty)} {tx.ingredient_unit || ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Belum ada aktivitas transaksi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
