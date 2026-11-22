import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "FridgeFlow — Smart Warehouse & Inventory Management",
  description:
    "Sistem manajemen gudang bahan baku, pemantauan batas minimum dan masa simpan stok, penyusunan resep, serta pencatatan produksi harian.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body
        className={`${plusJakarta.className} antialiased text-slate-900 bg-[#F8FAFC]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
