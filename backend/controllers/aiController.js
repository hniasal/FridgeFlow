import { GoogleGenAI } from "@google/genai";
import db from "../config/db.js";
import { isDiscreteUnit } from "../validations/ingredientValidation.js";

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const cleanNumber = (val) => {
  const num = Number(val);
  return Number.isInteger(num) ? num : Number(num.toFixed(2));
};

const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const datePart =
    expiryDate instanceof Date
      ? expiryDate.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
      : String(expiryDate).split("T")[0];
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const nowStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
  const [ny, nm, nd] = nowStr.split("-").map(Number);
  const today = new Date(ny, nm - 1, nd);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

export const getAiInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const ingRes = await db.query(
      "SELECT name, category, qty, unit, min_qty, expiry_date FROM ingredients WHERE user_id = $1",
      [userId],
    );
    const recRes = await db.query(
      "SELECT title FROM recipes WHERE user_id = $1 AND COALESCE(is_archived, false) = false",
      [userId],
    );

    const ingredients = ingRes.rows;
    const recipes = recRes.rows;

    if (ingredients.length === 0) {
      return res.status(200).json({
        status: "Success",
        data: [
          {
            type: "expiry",
            title: "Mulai Inventaris Gudang Dapur",
            description:
              "Tambahkan bahan baku pertama Anda di menu Bahan Baku agar sistem memantau stok dan masa simpan secara otomatis.",
          },
          {
            type: "warning",
            title: "Atur Batas Minimum Stok",
            description:
              "Tentukan batas minimum untuk setiap bahan pokok agar sistem memberi peringatan sebelum kehabisan.",
          },
          {
            type: "growth",
            title: "Siap Buat Resep & Produksi",
            description:
              "Susun resep di menu Resep lalu jalankan produksi harian di menu Produksi untuk memotong stok otomatis.",
          },
        ],
      });
    }

    const lowItems = ingredients.filter(
      (i) => Number(i.qty) <= Number(i.min_qty),
    );
    const expiredItems = ingredients.filter((i) => {
      const days = getDaysUntilExpiry(i.expiry_date);
      return days !== null && days < 0;
    });
    const expiringSoonItems = ingredients.filter((i) => {
      const days = getDaysUntilExpiry(i.expiry_date);
      return days !== null && days >= 0 && days <= 5;
    });
    const allExpiryAlertItems = [...expiredItems, ...expiringSoonItems];

    return res.status(200).json({
      status: "Success",
      data: [
        {
          type: "expiry",
          title:
            allExpiryAlertItems.length > 0
              ? `${allExpiryAlertItems.length} Bahan Mendekati / Lewat Kedaluwarsa`
              : "Kesegaran Bahan Terjaga",
          description:
            allExpiryAlertItems.length > 0
              ? `Segera periksa atau olah ${allExpiryAlertItems
                  .map((e) => e.name)
                  .join(", ")} sebelum melewati masa simpan.`
              : "Seluruh bahan baku memiliki masa simpan yang aman.",
        },
        {
          type: "warning",
          title:
            lowItems.length > 0
              ? `${lowItems.length} Stok di Bawah Batas Minimum`
              : "Level Stok Gudang Aman",
          description:
            lowItems.length > 0
              ? `Segera lakukan restock untuk ${lowItems
                  .map((l) => l.name)
                  .join(", ")} agar jadwal produksi tidak terhambat.`
              : "Semua bahan baku berada di atas batas minimum yang ditentukan.",
        },
        {
          type: "growth",
          title: "Kesiapan Produksi Harian",
          description:
            recipes.length > 0
              ? `Tersedia ${recipes.length} resep aktif. Atur jumlah produksi di menu Produksi untuk pemotongan stok otomatis.`
              : "Buat resep dari bahan yang tersedia di dapur untuk mulai merencanakan produksi harian.",
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

export const generateAiRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt: userPreference } = req.body;

    const ingRes = await db.query(
      "SELECT id, name, qty, unit, expiry_date FROM ingredients WHERE user_id = $1 AND qty > 0",
      [userId],
    );
    const availableIngredients = ingRes.rows;

    if (availableIngredients.length === 0) {
      return res.status(400).json({
        status: "Failed",
        message:
          "Stok bahan baku masih kosong. Tambahkan minimal 1 bahan baku terlebih dahulu.",
      });
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Kamu adalah Chef & R&D Kuliner untuk aplikasi FridgeFlow.
Daftar bahan yang tersedia di stok user (gunakan HANYA ingredient_id dari daftar ini):
${JSON.stringify(availableIngredients)}

Preferensi tambahan dari user: "${userPreference || "Buat resep lezat dan praktis dengan memprioritaskan bahan yang mendekati kedaluwarsa"}"

Buat 1 resep standar (takaran 1 resep) dalam bahasa Indonesia dengan format JSON murni tanpa markdown:
{
  "title": "Nama Resep",
  "instructions": "<p>Langkah-langkah pembuatan yang jelas dalam format HTML sederhana</p>",
  "ingredients": [
    {
      "ingredient_id": 1,
      "ingredient_name": "Nama Bahan",
      "qty_needed": 2,
      "unit": "unit_sama_seperti_di_stok"
    }
  ]
}
Pastikan qty_needed tidak melebihi qty yang tersedia, gunakan angka bulat untuk satuan seperti gram/butir/pcs/siung/bungkus, dan unit sama persis dengan stok.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const rawText = response.text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const generatedRecipe = JSON.parse(rawText);

        return res.status(200).json({
          status: "Success",
          data: generatedRecipe,
        });
      } catch (aiErr) {
        console.warn("Smart recipe fallback:", aiErr.message);
      }
    }

    const picked = availableIngredients.slice(0, 3).map((item) => {
      const avail = Number(item.qty);
      let suggested = Math.max(1, Math.floor(avail / 2));
      if (!isDiscreteUnit(item.unit) && avail < 1) {
        suggested = cleanNumber(avail / 2);
      }
      return {
        ingredient_id: item.id,
        ingredient_name: item.name,
        qty_needed: suggested,
        unit: item.unit,
      };
    });

    return res.status(200).json({
      status: "Success",
      data: {
        title: `Kreasi Spesial ${picked.map((p) => p.ingredient_name).join(" & ")}`,
        instructions: `<ol><li>Siapkan semua bahan (${picked
          .map((p) => `${p.ingredient_name} ${p.qty_needed} ${p.unit}`)
          .join(
            ", ",
          )}).</li><li>Campurkan bahan utama dan olah dengan api sedang hingga matang merata.</li><li>Sajikan atau kemas sesuai kebutuhan.</li></ol>`,
        ingredients: picked,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};
