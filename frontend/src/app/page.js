"use client";

import Link from "next/link";
import {
  Snowflake,
  PackageCheck,
  ChefHat,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Clock,
      tag: "Real-Time",
      title: "Pemantauan Kedaluwarsa Dini",
      desc: "Menandai bahan segar yang mendekati tanggal kedaluwarsa serta stok yang hampir menipis.",
    },
    {
      icon: ChefHat,
      tag: "Otomatis",
      title: "Pengecekan Kesiapan Produksi",
      desc: "Hitung kebutuhan bahan baku sesuai jumlah target produksi harian secara instan, lengkap dengan rincian kekurangan bahan.",
    },
    {
      icon: PackageCheck,
      tag: "1-Klik",
      title: "Pemotongan Stok Otomatis",
      desc: "Cukup satu klik saat mulai produksi—seluruh takaran bahan terpotong otomatis dan tercatat di riwayat.",
    },
    {
      icon: FileText,
      tag: "Terstruktur",
      title: "Catatan Resep & Ide Menu",
      desc: "Buat dan simpan resep serta temukan rekomendasi resep dari bahan baku tersedia di dapur.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Catat Bahan Baku Dapur",
      desc: "Masukkan daftar bahan, jumlah stok, satuan takaran, batas minimum, serta tanggal kedaluwarsa.",
    },
    {
      num: "02",
      title: "Susun Buku Resep Anda",
      desc: "Tambahkan bahan dari stok maupun bahan tambahan lainnya, lengkap dengan catatan langkah memasak.",
    },
    {
      num: "03",
      title: "Produksi & Pantau Riwayat",
      desc: "Tentukan jumlah target produksi harian, jalankan pemotongan stok otomatis, dan pantau seluruh riwayat penggunaan stok.",
    },
  ];

  return (
    <div className="min-h-screen sky-atmosphere text-slate-950">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl blue-gradient-card flex items-center justify-center text-white shadow-blueglow">
              <Snowflake className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-950">
              FRIDGE<span className="text-[#1D7AFC]">FLOW</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-700">
            <a href="#fitur" className="hover:text-[#1D7AFC] transition-colors">
              Fitur Utama
            </a>
            <a
              href="#cara-kerja"
              className="hover:text-[#1D7AFC] transition-colors"
            >
              Cara Kerja
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full blue-gradient-btn text-white text-sm font-bold shadow-blueglow transition-all"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-bold text-slate-800 hover:text-[#1D7AFC] transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-full blue-gradient-btn text-white text-sm font-bold shadow-blueglow transition-all"
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 text-white text-xs font-bold shadow-sm">
              <Snowflake className="w-3.5 h-3.5 text-sky-400" />
              <span>Manajemen Stok &amp; Bahan Baku Dapur</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 leading-[1.14] tracking-tight">
              Kelola Gudang Bahan Baku &amp; Produksi Dapur Secara Akurat.
            </h1>

            <p className="text-base text-slate-700 leading-relaxed">
              FridgeFlow membantu Anda mengelola gudang penyimpanan bahan baku,
              memantau batas minimum stok serta masa simpan, dan mencatat setiap
              arus keluar-masuk inventaris produksi dalam satu sistem yang
              terstruktur.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full blue-gradient-btn text-white font-bold text-sm shadow-blueglow transition-all"
              >
                <span>
                  {isAuthenticated ? "Buka Dashboard" : "Daftar Sekarang"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-4 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-card transition-all"
                >
                  Masuk ke Akun
                </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-3xl border-2 border-slate-300/90 shadow-soft relative overflow-hidden bg-gradient-to-b from-[#d8dde3] via-[#f1f4f8] to-[#dfe4ea] p-6 sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex flex-col justify-between"
              >
                <div className="mx-auto mt-1.5 h-3 w-28 rounded-b-lg border border-slate-300 bg-slate-200/90 flex items-center justify-center gap-1 px-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-0.5 bg-slate-500/70 rounded-full"
                    />
                  ))}
                </div>

                <div className="space-y-9 px-4 my-auto opacity-85">
                  {[0, 1, 2].map((shelf) => (
                    <div
                      key={shelf}
                      className="h-2.5 w-full rounded-full border-y border-slate-300 bg-gradient-to-r from-slate-200 via-white to-slate-200 shadow-xs"
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 px-4 pb-2 opacity-80">
                  <div className="h-10 rounded-t-xl border border-slate-300 bg-white/60 backdrop-blur-2xs" />
                  <div className="h-10 rounded-t-xl border border-slate-300 bg-white/60 backdrop-blur-2xs" />
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-md shrink-0">
                    <ChefHat className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-slate-200/80">
                    <p className="text-xs font-extrabold text-[#1D7AFC]">
                      Smart Warehouse &amp; Inventory
                    </p>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-950">
                      Kontrol Stok &amp; Produksi Otomatis
                    </h2>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Pantau Stok Minimum",
                    "Potong Stok Otomatis",
                    "Riwayat Akurat",
                  ].map((pill) => (
                    <span
                      key={pill}
                      className="px-3 py-1 rounded-xl bg-white/90 border border-slate-300/80 text-xs font-bold text-slate-900 shadow-2xs"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-300/80 flex items-center justify-between bg-white/75 backdrop-blur-xs -mx-6 -mb-6 sm:-mx-7 sm:-mb-7 px-6 py-4 sm:px-7">
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">
                      Kontrol Stok &amp; Takaran Akurat
                    </p>
                    <p className="text-sm font-extrabold text-slate-950">
                      Inventaris Terpantau Real-Time
                    </p>
                  </div>
                  <Link
                    href={isAuthenticated ? "/dashboard" : "/register"}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full blue-gradient-btn text-white text-xs font-extrabold shadow-blueglow transition-all"
                  >
                    <span>
                      {isAuthenticated ? "Buka Dashboard" : "Daftar Sekarang"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-soft">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-[#1D7AFC] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-950">
                      Kontrol Stok &amp; Takaran Akurat
                    </h3>
                    <p className="text-xs text-slate-600">
                      Cocok untuk dapur rumah tangga, kafe, katering, &amp; UMKM
                      kuliner
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "Protein",
                  "Dairy & Telur",
                  "Sayuran & Buah",
                  "Bumbu & Saus",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-[#0369A1] text-xs font-extrabold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fitur Utama</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Fitur Lengkap untuk Mengatur Gudang &amp; Dapur Anda
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Dirancang agar bahan baku selalu terpantau, resep mudah
              direncanakan, dan pencatatan stok berjalan otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:shadow-soft hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl blue-gradient-card text-white flex items-center justify-center shadow-blueglow">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[10px] font-bold">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-extrabold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Cara Kerja</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            Mulai dalam 3 Langkah Sederhana
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card hover:shadow-soft transition-all"
            >
              <span className="inline-block px-3.5 py-1 rounded-xl bg-slate-950 text-white text-xs font-extrabold mb-4">
                {step.num}
              </span>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200/80 bg-white/90 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span className="font-extrabold text-slate-950">
            FRIDGEFLOW — Smart Warehouse &amp; Inventory Management
          </span>
          <span>&copy; {new Date().getFullYear()} FridgeFlow</span>
        </div>
      </footer>
    </div>
  );
}
