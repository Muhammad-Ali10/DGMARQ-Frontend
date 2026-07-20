// ── Display-currency helpers (Module 10) ─────────────────────────────────────
// The platform stores and CHARGES everything in USD; the selected currency only
// changes how prices are DISPLAYED. Conversion happens client-side against the
// daily rates from GET /currency/rates.

// Must stay in sync with SUPPORTED_CURRENCIES on the backend. Ported from the
// v74 mockup's DG_CURRENCIES list: [code, flag, name, symbol]. The symbol is only
// used for the selector label — actual prices are formatted via Intl.NumberFormat
// (which handles per-currency decimals/grouping correctly).
export const SUPPORTED_CURRENCIES = [
  { code: "AUD", flag: "au", name: "Australian Dollar", symbol: "A$" },
  { code: "USD", flag: "us", name: "US Dollar", symbol: "$" },
  { code: "EUR", flag: "eu", name: "Euro", symbol: "€" },
  { code: "GBP", flag: "gb", name: "British Pound", symbol: "£" },
  { code: "JPY", flag: "jp", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", flag: "ca", name: "Canadian Dollar", symbol: "C$" },
  { code: "NZD", flag: "nz", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "CHF", flag: "ch", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", flag: "cn", name: "Chinese Yuan", symbol: "¥" },
  { code: "HKD", flag: "hk", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SGD", flag: "sg", name: "Singapore Dollar", symbol: "S$" },
  { code: "SEK", flag: "se", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", flag: "no", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", flag: "dk", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", flag: "pl", name: "Polish Zloty", symbol: "zł" },
  { code: "CZK", flag: "cz", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", flag: "hu", name: "Hungarian Forint", symbol: "Ft" },
  { code: "RON", flag: "ro", name: "Romanian Leu", symbol: "lei" },
  { code: "BGN", flag: "bg", name: "Bulgarian Lev", symbol: "лв" },
  { code: "HRK", flag: "hr", name: "Croatian Kuna", symbol: "kn" },
  { code: "RUB", flag: "ru", name: "Russian Ruble", symbol: "₽" },
  { code: "TRY", flag: "tr", name: "Turkish Lira", symbol: "₺" },
  { code: "UAH", flag: "ua", name: "Ukrainian Hryvnia", symbol: "₴" },
  { code: "INR", flag: "in", name: "Indian Rupee", symbol: "₹" },
  { code: "IDR", flag: "id", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "MYR", flag: "my", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "PHP", flag: "ph", name: "Philippine Peso", symbol: "₱" },
  { code: "THB", flag: "th", name: "Thai Baht", symbol: "฿" },
  { code: "VND", flag: "vn", name: "Vietnamese Dong", symbol: "₫" },
  { code: "KRW", flag: "kr", name: "South Korean Won", symbol: "₩" },
  { code: "TWD", flag: "tw", name: "Taiwan Dollar", symbol: "NT$" },
  { code: "BRL", flag: "br", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", flag: "mx", name: "Mexican Peso", symbol: "$" },
  { code: "ARS", flag: "ar", name: "Argentine Peso", symbol: "$" },
  { code: "CLP", flag: "cl", name: "Chilean Peso", symbol: "$" },
  { code: "COP", flag: "co", name: "Colombian Peso", symbol: "$" },
  { code: "PEN", flag: "pe", name: "Peruvian Sol", symbol: "S/" },
  { code: "SAR", flag: "sa", name: "Saudi Riyal", symbol: "﷼" },
  { code: "QAR", flag: "qa", name: "Qatari Riyal", symbol: "﷼" },
  { code: "KWD", flag: "kw", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "BHD", flag: "bh", name: "Bahraini Dinar", symbol: ".د.ب" },
  { code: "OMR", flag: "om", name: "Omani Rial", symbol: "﷼" },
  { code: "JOD", flag: "jo", name: "Jordanian Dinar", symbol: "د.ا" },
  { code: "ILS", flag: "il", name: "Israeli Shekel", symbol: "₪" },
  { code: "EGP", flag: "eg", name: "Egyptian Pound", symbol: "£" },
  { code: "MAD", flag: "ma", name: "Moroccan Dirham", symbol: "د.م." },
  { code: "NGN", flag: "ng", name: "Nigerian Naira", symbol: "₦" },
  { code: "KES", flag: "ke", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", flag: "gh", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "ISK", flag: "is", name: "Icelandic Krona", symbol: "kr" },
  { code: "PKR", flag: "pk", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", flag: "bd", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "LKR", flag: "lk", name: "Sri Lankan Rupee", symbol: "₨" },
  { code: "NPR", flag: "np", name: "Nepalese Rupee", symbol: "₨" },
  { code: "KZT", flag: "kz", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "GEL", flag: "ge", name: "Georgian Lari", symbol: "₾" },
  { code: "AZN", flag: "az", name: "Azerbaijani Manat", symbol: "₼" },
  { code: "RSD", flag: "rs", name: "Serbian Dinar", symbol: "дин" },
  { code: "MKD", flag: "mk", name: "Macedonian Denar", symbol: "ден" },
  { code: "ALL", flag: "al", name: "Albanian Lek", symbol: "L" },
  { code: "BAM", flag: "ba", name: "Bosnia Mark", symbol: "KM" },
  { code: "MDL", flag: "md", name: "Moldovan Leu", symbol: "L" },
  { code: "BYN", flag: "by", name: "Belarusian Ruble", symbol: "Br" },
  { code: "UZS", flag: "uz", name: "Uzbekistani Som", symbol: "лв" },
  { code: "TND", flag: "tn", name: "Tunisian Dinar", symbol: "د.ت" },
  { code: "DZD", flag: "dz", name: "Algerian Dinar", symbol: "د.ج" },
];

export const SUPPORTED_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

// Buyer country (ISO alpha-2, from M9 geo) → default display currency.
// Only maps to a SUPPORTED currency; every other country falls back to USD.
// Croatia (HR) uses the euro since 2023, so it maps to EUR (HRK stays selectable
// but no country auto-detects to it).
const EURO_COUNTRIES = [
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "MC", "SM", "VA", "AD", "ME", "XK",
];
const COUNTRY_TO_CURRENCY = {
  // Anglosphere / majors
  GB: "GBP", IM: "GBP", JE: "GBP", GG: "GBP",
  AU: "AUD", NR: "AUD", KI: "AUD", TV: "AUD",
  CA: "CAD",
  NZ: "NZD", CK: "NZD", NU: "NZD",
  SG: "SGD", JP: "JPY", CH: "CHF", LI: "CHF", CN: "CNY", HK: "HKD",
  // Nordics
  SE: "SEK", NO: "NOK", SJ: "NOK", DK: "DKK", FO: "DKK", GL: "DKK", IS: "ISK",
  // Central / Eastern Europe
  PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN", RU: "RUB", TR: "TRY",
  UA: "UAH", RS: "RSD", MK: "MKD", AL: "ALL", BA: "BAM", MD: "MDL", BY: "BYN",
  // Asia
  IN: "INR", ID: "IDR", MY: "MYR", PH: "PHP", TH: "THB", VN: "VND", KR: "KRW",
  TW: "TWD", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", KZ: "KZT", UZ: "UZS",
  GE: "GEL", AZ: "AZN",
  // Middle East
  SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR", JO: "JOD", IL: "ILS",
  PS: "ILS",
  // Africa
  EG: "EGP", MA: "MAD", EH: "MAD", NG: "NGN", KE: "KES", GH: "GHS", TN: "TND",
  DZ: "DZD",
  // Latin America
  BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN",
};
for (const c of EURO_COUNTRIES) COUNTRY_TO_CURRENCY[c] = "EUR";

/** Default display currency for a buyer country ("US"→USD, "DE"→EUR, …). */
export const currencyForCountry = (countryCode) => {
  const code = String(countryCode || "").toUpperCase();
  return COUNTRY_TO_CURRENCY[code] || "USD";
};

/** Convert a USD amount using a rates map; returns null when unconvertible. */
export const convertFromUSD = (usdAmount, currency, rates) => {
  const amount = Number(usdAmount);
  if (!Number.isFinite(amount)) return null;
  if (currency === "USD") return amount;
  const rate = Number(rates?.[currency]);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return amount * rate;
};

// Intl formatters are surprisingly expensive to construct — cache per currency.
const formatterCache = new Map();
const getFormatter = (currency) => {
  let fmt = formatterCache.get(currency);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat("en", { style: "currency", currency });
    } catch {
      fmt = null;
    }
    formatterCache.set(currency, fmt);
  }
  return fmt;
};

/**
 * Format a USD amount in the display currency ("€9.19", "¥1,628").
 * Falls back to plain USD when the rate is missing — never shows a wrong number.
 */
export const formatDisplayPrice = (usdAmount, currency, rates) => {
  const amount = Number(usdAmount) || 0;
  const converted = convertFromUSD(amount, currency, rates);
  if (converted === null || currency === "USD") {
    const fmt = getFormatter("USD");
    return fmt ? fmt.format(amount) : `$${amount.toFixed(2)}`;
  }
  const fmt = getFormatter(currency);
  return fmt ? fmt.format(converted) : `${converted.toFixed(2)} ${currency}`;
};
