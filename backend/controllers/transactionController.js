import db from "../config/db.js";

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

const sanitizeTimezone = (tz) => {
  if (!tz || typeof tz !== "string") return "Asia/Jakarta";
  return /^[A-Za-z0-9_\/+-]{1,50}$/.test(tz) ? tz : "Asia/Jakarta";
};

export const getTransactions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, t.type, t.qty, t.notes, t.created_at,
              i.name AS ingredient_name, i.unit AS ingredient_unit,
              r.title AS recipe_title
       FROM transactions t
       LEFT JOIN ingredients i ON t.ingredient_id = i.id
       LEFT JOIN recipes r ON t.recipe_id = r.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id],
    );

    res.status(200).json({
      status: "Success",
      data: result.rows.map((r) => ({ ...r, qty: cleanNumber(r.qty) })),
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userTz = sanitizeTimezone(req.query.tz);

    const ingRes = await db.query(
      "SELECT * FROM ingredients WHERE user_id = $1 ORDER BY expiry_date ASC NULLS LAST",
      [userId],
    );
    const ingredients = ingRes.rows.map((r) => ({
      ...r,
      qty: cleanNumber(r.qty),
      min_qty: cleanNumber(r.min_qty),
    }));

    const lowStockItems = ingredients.filter(
      (item) => Number(item.qty) <= Number(item.min_qty),
    );

    const expiringSoonItems = ingredients.filter((item) => {
      const daysLeft = getDaysUntilExpiry(item.expiry_date);
      return daysLeft !== null && daysLeft <= 5;
    });

    const criticalMap = new Map();
    for (const item of expiringSoonItems) {
      const daysLeft = getDaysUntilExpiry(item.expiry_date);
      criticalMap.set(item.id, {
        ...item,
        alert_type: daysLeft < 0 ? "EXPIRED" : "EXPIRING",
      });
    }
    for (const item of lowStockItems) {
      if (!criticalMap.has(item.id)) {
        criticalMap.set(item.id, { ...item, alert_type: "LOW_STOCK" });
      }
    }
    const allCriticalIngredients = Array.from(criticalMap.values());

    const recRes = await db.query(
      "SELECT id, title FROM recipes WHERE user_id = $1 AND COALESCE(is_archived, false) = false",
      [userId],
    );

    const recipes = recRes.rows;

    let readyRecipesCount = 0;
    if (recipes.length > 0) {
      const recipeIds = recipes.map((r) => r.id);
      const riRes = await db.query(
        `SELECT ri.recipe_id, ri.ingredient_id, ri.qty_needed, COALESCE(i.qty, 0) AS stock_available
         FROM recipe_ingredients ri
         LEFT JOIN ingredients i ON ri.ingredient_id = i.id
         WHERE ri.recipe_id = ANY($1::int[])`,
        [recipeIds],
      );

      for (const r of recipes) {
        const items = riRes.rows.filter((x) => x.recipe_id === r.id);
        if (
          items.length > 0 &&
          items.every(
            (x) =>
              x.ingredient_id &&
              Number(x.stock_available) >= Number(x.qty_needed),
          )
        ) {
          readyRecipesCount++;
        }
      }
    }

    let trendRows = [];
    try {
      const trendRes = await db.query(
        `SELECT TO_CHAR(created_at AT TIME ZONE 'UTC' AT TIME ZONE $2, 'Dy') AS day_label,
                EXTRACT(DOW FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE $2)) AS dow,
                COUNT(*) FILTER (WHERE type = 'IN')::int AS in_count,
                COUNT(*) FILTER (WHERE type = 'OUT')::int AS out_count,
                COUNT(*)::int AS total_activity
         FROM transactions
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY day_label, dow
         ORDER BY dow ASC`,
        [userId, userTz],
      );
      trendRows = trendRes.rows;
    } catch {
      const fallbackRes = await db.query(
        `SELECT TO_CHAR(created_at, 'Dy') AS day_label,
                EXTRACT(DOW FROM created_at) AS dow,
                COUNT(*) FILTER (WHERE type = 'IN')::int AS in_count,
                COUNT(*) FILTER (WHERE type = 'OUT')::int AS out_count,
                COUNT(*)::int AS total_activity
         FROM transactions
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY day_label, dow
         ORDER BY dow ASC`,
        [userId],
      );
      trendRows = fallbackRes.rows;
    }

    const daysOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyTrends = daysOrder.map((day, idx) => {
      const found = trendRows.find((r) => Number(r.dow) === idx);
      return {
        day,
        in_count: found ? found.in_count : 0,
        out_count: found ? found.out_count : 0,
        total_activity: found ? found.total_activity : 0,
      };
    });

    const recentTxRes = await db.query(
      `SELECT t.id, t.type, t.qty, t.notes, t.created_at,
              i.name AS ingredient_name, i.unit AS ingredient_unit
       FROM transactions t
       LEFT JOIN ingredients i ON t.ingredient_id = i.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [userId],
    );

    res.status(200).json({
      status: "Success",
      data: {
        stats: {
          totalIngredients: ingredients.length,
          lowStockCount: lowStockItems.length,
          expiringSoonCount: expiringSoonItems.length,
          attentionCount: allCriticalIngredients.length,
          totalRecipes: recipes.length,
          readyRecipesCount,
          totalTransactionsWeek: weeklyTrends.reduce(
            (sum, d) => sum + d.total_activity,
            0,
          ),
        },
        weeklyTrends,
        criticalIngredients: allCriticalIngredients.slice(0, 8),
        recentTransactions: recentTxRes.rows.map((r) => ({
          ...r,
          qty: cleanNumber(r.qty),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};
