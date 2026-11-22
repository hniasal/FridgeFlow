import { GoogleGenAI } from "@google/genai";
import db from "../config/db.js";
import { isDiscreteUnit } from "../validations/ingredientValidation.js";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateWithRetry = async (ai, params, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const msg = String(err?.message || "");
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("high demand");

      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await sleep(1500 * attempt);
    }
  }
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

const normalizeRecipeIngredients = (rawIngredients, allIngredients) => {
  return (rawIngredients || []).map((item) => {
    const rawName = String(item.ingredient_name || "").trim();
    const reqLower = rawName.toLowerCase();

    const matched =
      allIngredients.find(
        (ing) =>
          item.ingredient_id !== null &&
          item.ingredient_id !== undefined &&
          ing.id === Number(item.ingredient_id),
      ) ||
      allIngredients.find((ing) => {
        const dbLower = ing.name.trim().toLowerCase();
        if (dbLower === reqLower) return true;
        if (dbLower.length >= 3 && reqLower.length >= 3) {
          return dbLower.includes(reqLower) || reqLower.includes(dbLower);
        }
        return false;
      });

    const targetUnit = matched?.unit || String(item.unit || "gram").trim();
    const parsedQty = Number(item.qty_needed) || 1;
    const qtyNeeded = isDiscreteUnit(targetUnit)
      ? Math.max(1, Math.round(parsedQty))
      : Math.max(0.1, cleanNumber(parsedQty));

    if (matched) {
      const availQty = cleanNumber(Number(matched.qty) || 0);
      return {
        ingredient_id: matched.id,
        ingredient_name: matched.name,
        custom_name: null,
        qty_needed: qtyNeeded,
        unit: matched.unit,
        available_qty: availQty,
        is_available: availQty >= qtyNeeded,
      };
    }

    return {
      ingredient_id: null,
      ingredient_name: rawName,
      custom_name: rawName,
      qty_needed: qtyNeeded,
      unit: targetUnit,
      available_qty: 0,
      is_available: false,
    };
  });
};

const formatDishTitle = (promptText) => {
  const cleaned = promptText
    .replace(/^(resep|buatkan|buat|cara membuat|ide|menu)\s+/i, "")
    .trim();
  if (!cleaned) return "Kreasi Menu Spesial";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
};

const buildPromptFallbackRecipe = (trimmedPrompt, allIngredients) => {
  const lower = trimmedPrompt.toLowerCase();
  const title = formatDishTitle(trimmedPrompt);

  const presets = [
    {
      match: ["tiramisu"],
      title: "Tiramisu Klasik",
      ingredients: [
        { ingredient_name: "Telur", qty_needed: 2, unit: "butir" },
        { ingredient_name: "Keju Mascarpone", qty_needed: 250, unit: "gram" },
        { ingredient_name: "Biskuit Ladyfinger", qty_needed: 12, unit: "pcs" },
        { ingredient_name: "Susu Cair", qty_needed: 150, unit: "ml" },
        { ingredient_name: "Gula Pasir", qty_needed: 60, unit: "gram" },
        { ingredient_name: "Bubuk Kopi Instan", qty_needed: 10, unit: "gram" },
        { ingredient_name: "Cokelat Bubuk", qty_needed: 15, unit: "gram" },
      ],
      instructions:
        "<ol><li>Seduh bubuk kopi dengan air hangat lalu campurkan dengan susu cair, sisihkan hingga dingin.</li><li>Kocok kuning telur dan gula pasir hingga pucat dan mengental, lalu campurkan keju mascarpone hingga lembut.</li><li>Celupkan biskuit ladyfinger sebentar ke larutan kopi, susun di wadah, lalu lapisi dengan krim mascarpone secara bergantian.</li><li>Taburi cokelat bubuk di atasnya dan dinginkan di kulkas minimal 3 jam sebelum disajikan.</li></ol>",
    },
    {
      match: ["ayam kecap"],
      title: "Ayam Kecap Manis",
      ingredients: [
        { ingredient_name: "Daging Ayam", qty_needed: 500, unit: "gram" },
        { ingredient_name: "Kecap Manis", qty_needed: 4, unit: "sdm" },
        { ingredient_name: "Bawang Putih", qty_needed: 3, unit: "siung" },
        { ingredient_name: "Bawang Merah", qty_needed: 5, unit: "siung" },
        { ingredient_name: "Garam", qty_needed: 1, unit: "sdt" },
        { ingredient_name: "Merica Bubuk", qty_needed: 1, unit: "sdt" },
      ],
      instructions:
        "<ol><li>Lumuri potongan ayam dengan garam dan merica, lalu goreng setengah matang.</li><li>Tumis bawang merah dan bawang putih hingga harum.</li><li>Masukkan ayam, tambahkan kecap manis dan sedikit air, lalu masak hingga bumbu meresap dan kuah mengental.</li></ol>",
    },
    {
      match: ["nasi goreng"],
      title: "Nasi Goreng Spesial",
      ingredients: [
        { ingredient_name: "Nasi Putih", qty_needed: 200, unit: "gram" },
        { ingredient_name: "Telur", qty_needed: 1, unit: "butir" },
        { ingredient_name: "Bawang Putih", qty_needed: 2, unit: "siung" },
        { ingredient_name: "Kecap Manis", qty_needed: 2, unit: "sdm" },
        { ingredient_name: "Garam", qty_needed: 1, unit: "sdt" },
      ],
      instructions:
        "<ol><li>Tumis bawang putih cincang hingga harum, lalu masukkan telur dan buat orak-arik.</li><li>Masukkan nasi putih, kecap manis, dan garam, lalu aduk rata di atas api besar hingga matang.</li></ol>",
    },
    {
      match: ["telur"],
      title: title.toLowerCase() === "telur" ? "Telur Dadar Gurih" : title,
      ingredients: [
        { ingredient_name: "Telur", qty_needed: 2, unit: "butir" },
        { ingredient_name: "Bawang Merah", qty_needed: 2, unit: "siung" },
        { ingredient_name: "Garam", qty_needed: 1, unit: "sdt" },
        { ingredient_name: "Minyak Goreng", qty_needed: 2, unit: "sdm" },
      ],
      instructions:
        "<ol><li>Kocok lepas telur bersama irisan bawang merah dan garam hingga berbuih ringan.</li><li>Panaskan minyak goreng di wajan, tuang adonan telur, dan masak kedua sisinya hingga matang keemasan.</li></ol>",
    },
  ];

  const matchedPreset = presets.find((p) =>
    p.match.some((kw) => lower.includes(kw)),
  );

  if (matchedPreset) {
    return {
      title: matchedPreset.title,
      instructions: matchedPreset.instructions,
      ingredients: normalizeRecipeIngredients(
        matchedPreset.ingredients,
        allIngredients,
      ),
    };
  }

  const relatedStock = allIngredients.filter((ing) =>
    lower.includes(ing.name.trim().toLowerCase()),
  );

  const fallbackRawIngredients =
    relatedStock.length > 0
      ? relatedStock.map((item) => ({
          ingredient_id: item.id,
          ingredient_name: item.name,
          qty_needed: 1,
          unit: item.unit,
        }))
      : [
          {
            ingredient_id: null,
            ingredient_name: `Bahan Utama ${title}`,
            qty_needed: 1,
            unit: "pcs",
          },
        ];

  return {
    title,
    instructions: `<ol><li>Siapkan seluruh bahan untuk membuat ${title}.</li><li>Olah bahan utama sesuai takaran dengan api sedang hingga matang merata dan bumbu meresap.</li><li>Koreksi rasa dan sajikan selagi hangat.</li></ol>`,
    ingredients: normalizeRecipeIngredients(
      fallbackRawIngredients,
      allIngredients,
    ),
  };
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
    const trimmedPrompt = String(req.body?.prompt || "").trim();

    const ingRes = await db.query(
      "SELECT id, name, qty, unit, expiry_date FROM ingredients WHERE user_id = $1",
      [userId],
    );
    const allIngredients = ingRes.rows;

    if (allIngredients.length === 0 && !trimmedPrompt) {
      return res.status(400).json({
        status: "Failed",
        message:
          "Stok bahan baku masih kosong. Tambahkan minimal 1 bahan baku atau ketik nama resep yang diinginkan.",
      });
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Kamu adalah Chef & R&D Kuliner untuk aplikasi FridgeFlow.
Daftar bahan yang tercatat di inventaris dapur user:
${JSON.stringify(allIngredients)}

Permintaan resep dari user: "${trimmedPrompt || "Buat resep lezat dan praktis dengan memprioritaskan bahan yang tersedia dan mendekati kedaluwarsa"}"

Aturan wajib:
1. Jika user meminta nama hidangan atau resep tertentu (misalnya "resep tiramisu", "resep ayam kecap", "nasi goreng"), WAJIB buat resep asli hidangan tersebut beserta seluruh bahan aslinya, MESKIPUN sebagian atau seluruh bahannya tidak ada di daftar inventaris user. JANGAN mengganti menu yang diminta user menjadi menu lain hanya karena bahannya tidak tersedia di stok.
2. Jika permintaan user kosong, prioritaskan bahan yang tersedia di inventaris terutama yang mendekati tanggal kedaluwarsa.
3. Untuk setiap bahan dalam resep:
   - Jika nama bahan cocok atau merupakan bagian dari daftar inventaris user (misalnya inventaris punya "Telur" dan resep butuh "Telur"), isi "ingredient_id" dengan id dari inventaris dan samakan "unit"-nya.
   - Jika bahan TIDAK ada di daftar inventaris user (misalnya "Susu", "Keju Mascarpone", "Biskuit Ladyfinger"), isi "ingredient_id" dengan null dan tulis nama bahan standar yang jelas pada "ingredient_name".
4. Gunakan angka bulat untuk satuan diskrit seperti gram, butir, pcs, siung, batang, lembar, atau bungkus.

Balas HANYA dengan objek JSON valid:
{
  "title": "Nama Resep",
  "instructions": "<ol><li>Langkah pembuatan yang jelas dalam format HTML sederhana</li></ol>",
  "ingredients": [
    {
      "ingredient_id": 1,
      "ingredient_name": "Nama Bahan",
      "qty_needed": 2,
      "unit": "butir"
    }
  ]
}`;

        const response = await generateWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const rawText = String(response.text || "").trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const generatedRecipe = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

        return res.status(200).json({
          status: "Success",
          data: {
            title: generatedRecipe.title,
            instructions: generatedRecipe.instructions,
            ingredients: normalizeRecipeIngredients(
              generatedRecipe.ingredients,
              allIngredients,
            ),
          },
        });
      } catch (aiErr) {
        console.warn("Smart recipe Gemini fallback:", aiErr.message);
      }
    }

    if (trimmedPrompt) {
      return res.status(200).json({
        status: "Success",
        data: buildPromptFallbackRecipe(trimmedPrompt, allIngredients),
      });
    }

    const inStockIngredients = allIngredients
      .filter((i) => Number(i.qty) > 0)
      .sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      });

    if (inStockIngredients.length === 0) {
      return res.status(400).json({
        status: "Failed",
        message:
          "Stok bahan baku masih kosong. Tambahkan minimal 1 bahan baku terlebih dahulu.",
      });
    }

    const picked = inStockIngredients.slice(0, 3).map((item) => {
      const avail = Number(item.qty);
      let suggested = Math.max(1, Math.floor(avail / 2));
      if (!isDiscreteUnit(item.unit) && avail < 1) {
        suggested = cleanNumber(avail / 2);
      }
      return {
        ingredient_id: item.id,
        ingredient_name: item.name,
        custom_name: null,
        qty_needed: suggested,
        unit: item.unit,
        available_qty: cleanNumber(avail),
        is_available: avail >= suggested,
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
