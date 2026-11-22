"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import {
  Snowflake,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginPage() {
  const { login, verifyOtp, loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const hasGoogleClient = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!EMAIL_PATTERN.test(email.trim()) || !password.trim()) {
      setErrorMsg("Email atau kata sandi tidak valid.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) {
        setInfoMsg(data.message);
        setNeedsOtp(true);
      } else {
        setErrorMsg(data?.message || "Email atau kata sandi tidak valid.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp);
      router.push("/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "Kode OTP tidak sesuai atau kedaluwarsa.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg("");
    try {
      await loginWithGoogle(credentialResponse.credential);
      router.push("/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Gagal masuk menggunakan akun Google.",
      );
    }
  };

  return (
    <div className="min-h-screen sky-atmosphere p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-soft p-7 sm:p-9">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1D7AFC]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl blue-gradient-card flex items-center justify-center text-white shadow-blueglow">
            <Snowflake className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl text-slate-950">
            FRIDGE<span className="text-[#1D7AFC]">FLOW</span>
          </span>
        </div>

        {!needsOtp ? (
          <>
            <h1 className="text-2xl font-extrabold text-slate-950">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm text-slate-600 mt-1 mb-6">
              Masuk ke akun FridgeFlow Anda untuk mengelola dapur.
            </p>

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 text-red-700 text-xs font-bold bg-red-50 border border-red-200 px-3.5 py-3 rounded-2xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC] focus:ring-2 focus:ring-[#1D7AFC]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-300 text-sm text-slate-950 focus:outline-none focus:border-[#1D7AFC] focus:ring-2 focus:ring-[#1D7AFC]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full blue-gradient-btn text-white font-bold text-sm flex items-center justify-center gap-2 shadow-blueglow transition-all disabled:opacity-60"
              >
                <span>{loading ? "..." : "Masuk"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {hasGoogleClient && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Atau lanjutkan dengan
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() =>
                      setErrorMsg("Gagal menghubungkan layanan masuk Google.")
                    }
                    shape="pill"
                    width="100%"
                  />
                </div>
              </>
            )}

            <p className="mt-6 text-center text-xs text-slate-600">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-extrabold text-[#1D7AFC] hover:underline"
              >
                Daftar
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-slate-950">
              Verifikasi Kode OTP
            </h1>
            <p className="text-sm text-slate-600 mt-1 mb-5">
              Masukkan 6 digit kode verifikasi yang telah dikirim ke{" "}
              <strong className="text-slate-950">{email}</strong>
            </p>

            {infoMsg && (
              <div className="mb-4 flex items-start gap-2 text-emerald-800 text-xs font-bold bg-emerald-50 border border-emerald-200 px-3.5 py-3 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{infoMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 text-red-700 text-xs font-bold bg-red-50 border border-red-200 px-3.5 py-3 rounded-2xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kode OTP
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-base font-extrabold tracking-[0.35em] text-slate-950 focus:outline-none focus:border-[#1D7AFC]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 px-6 rounded-full blue-gradient-btn text-white font-bold text-sm flex items-center justify-center gap-2 shadow-blueglow transition-all disabled:opacity-60"
              >
                <span>{loading ? "..." : "Verifikasi & Masuk"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setNeedsOtp(false);
                  setErrorMsg("");
                }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Kembali ke form masuk
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
