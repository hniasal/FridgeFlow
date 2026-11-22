"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Filter, Clock } from "lucide-react";
import api from "../../../api/axios";
import { formatQty, formatLocalDateTime } from "../../../utils/formatters";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await api.get("/transactions");
        setTransactions(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, []);

  const filtered = transactions.filter(
    (item) => filterType === "ALL" || item.type === filterType,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            Riwayat Penggunaan Stok
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Catatan lengkap setiap stok masuk dan pemakaian produksi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500 mr-1" />
          {[
            { id: "ALL", label: "Semua" },
            { id: "IN", label: "Stok Masuk" },
            { id: "OUT", label: "Stok Keluar" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filterType === tab.id
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-sky-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-sm text-slate-500">
            Memuat riwayat penggunaan stok...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-sm text-slate-500">
            Belum ada riwayat penggunaan stok.
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                <th className="pb-3.5">Tipe</th>
                <th className="pb-3.5">Bahan Baku</th>
                <th className="pb-3.5">Jumlah</th>
                <th className="pb-3.5">Keterangan</th>
                <th className="pb-3.5">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#1D7AFC]" />
                    <span>Waktu</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-sky-50/40">
                  <td className="py-3.5">
                    {tx.type === "IN" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        MASUK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        KELUAR
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 font-bold text-slate-950">
                    {tx.ingredient_name || "Bahan Terhapus"}
                  </td>
                  <td
                    className={`py-3.5 font-extrabold ${
                      tx.type === "IN" ? "text-emerald-700" : "text-slate-950"
                    }`}
                  >
                    {tx.type === "IN" ? "+" : "-"}
                    {formatQty(tx.qty)} {tx.ingredient_unit || ""}
                  </td>
                  <td className="py-3.5 text-slate-600 text-xs">
                    {tx.notes || "-"}
                  </td>
                  <td className="py-3.5 text-slate-600 text-xs font-semibold whitespace-nowrap">
                    {formatLocalDateTime(tx.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
