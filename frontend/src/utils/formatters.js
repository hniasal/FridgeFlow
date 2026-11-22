export const COMMON_UNITS = [
  "gram",
  "kg",
  "ml",
  "liter",
  "butir",
  "pcs",
  "siung",
  "lembar",
  "bungkus",
  "botol",
  "ikat",
  "potong",
  "buah",
  "sdm",
  "sdt",
  "pack",
  "kaleng",
  "sachet",
];

export const DISCRETE_UNITS = [
  "gram",
  "butir",
  "pcs",
  "siung",
  "lembar",
  "bungkus",
  "botol",
  "ikat",
  "potong",
  "buah",
  "pack",
  "kaleng",
  "sachet",
];

export const isDiscreteUnit = (unit = "") =>
  DISCRETE_UNITS.includes(String(unit).trim().toLowerCase());

export const formatQty = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(2)));
};

export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const datePart = String(expiryDate).split("T")[0];
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

export const formatDateDisplay = (expiryDate) => {
  if (!expiryDate) return "-";
  const datePart = String(expiryDate).split("T")[0];
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return datePart;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getIngredientAlertStatus = (item) => {
  const isLowStock = Number(item.qty) <= Number(item.min_qty);
  const daysLeft = getDaysUntilExpiry(item.expiry_date);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;
  const isCritical = isLowStock || isExpired || isExpiringSoon;

  return {
    isCritical,
    isLowStock,
    isExpired,
    isExpiringSoon,
    daysLeft,
  };
};

export const getUserTimezoneInfo = () => {
  try {
    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    return { timeZone };
  } catch {
    return { timeZone: "Asia/Jakarta" };
  }
};

export const formatLocalDateTime = (isoTimestamp) => {
  if (!isoTimestamp) return "-";
  const raw = String(isoTimestamp);
  const normalized =
    raw.includes("Z") || raw.includes("+") ? raw : raw.replace(" ", "T") + "Z";
  const dateObj = new Date(normalized);
  if (Number.isNaN(dateObj.getTime())) return raw;

  const { timeZone } = getUserTimezoneInfo();
  return dateObj.toLocaleString("id-ID", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
