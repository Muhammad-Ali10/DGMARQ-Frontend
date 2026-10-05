import { PUBLISHED_FIGURES } from './publishedFigures';

/**
 * Live figures in legal copy.
 *
 * Documents write `{token}` where an admin-configurable number belongs, and this
 * resolves them against the values from `GET /legal/figures`. One number reaches
 * every place it appears — the summary tile, the clause, the section title and the
 * worked example — so the page can never contradict itself or the platform.
 *
 * Tokens are FUNCTIONS, not a flat lookup, because several are derived: a fee has
 * to carry its currency, and the refund examples have to be recalculated (a 30-day
 * window has no "35th of the month").
 */

/** What each document was drafted with. Used until the live values arrive, and if
 *  the request fails — a contract page must never render a blank where a number
 *  belongs. `currency` is AUD here because that is what the Terms were drafted in. */
export const DRAFTED_FIGURES = {
  refundWindowDays: PUBLISHED_FIGURES.refundWindowDays.value,
  payoutHoldDays: PUBLISHED_FIGURES.payoutHoldDays.value,
  buyerProtectionFeePercent: PUBLISHED_FIGURES.buyerProtectionFeePercent.value,
  buyerProcessingFeeFixed: PUBLISHED_FIGURES.buyerProcessingFeeFixed.value,
  commissionRatePercent: PUBLISHED_FIGURES.commissionRatePercent.value,
  featuredCommissionPercent: PUBLISHED_FIGURES.featuredCommissionPercent.value,
  currency: 'AUD',
};

/**
 * The figures to render, given whatever the API returned.
 *
 * A live value is taken only when it is usable: a null, a missing field or a
 * non-numeric one falls back to the drafted figure, because "NaN%" inside a
 * clause is worse than a slightly stale number. Pure, so it is tested directly.
 */
export const mergeFigures = (data) => {
  if (!data) return DRAFTED_FIGURES;
  const merged = { ...DRAFTED_FIGURES };
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof DRAFTED_FIGURES[key] === 'number' && !Number.isFinite(Number(value))) continue;
    merged[key] = value;
  }
  return merged;
};

// Trailing zeros read as fake precision in a sentence: "7%", never "7.0%".
const num = (value) => String(Math.round(Number(value) * 100) / 100);

const money = (figures, amount) => `${figures.currency} $${Number(amount).toFixed(2)}`;

// A fixed illustrative month for the refund examples. June has 30 days, so the
// worked example reads naturally at the short end and rolls into July at the long
// end instead of inventing a 35th.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EXAMPLE_YEAR = 2026;
const EXAMPLE_MONTH = 5; // June
const exampleDay = (day, plusDays = 0) => {
  const date = new Date(Date.UTC(EXAMPLE_YEAR, EXAMPLE_MONTH, day + plusDays));
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
};
const DELIVERED_ON = 1;
const CONFIRMED_ON = 5;

const TOKENS = {
  refundWindowDays: (f) => num(f.refundWindowDays),
  payoutHoldDays: (f) => num(f.payoutHoldDays),
  buyerProtectionFeePercent: (f) => num(f.buyerProtectionFeePercent),
  commissionRatePercent: (f) => num(f.commissionRatePercent),
  featuredCommissionPercent: (f) => num(f.featuredCommissionPercent),
  processingFee: (f) => money(f, f.buyerProcessingFeeFixed),
  // The Fee Schedule's worked example on a $100 sale.
  commissionOn100: (f) => `$${(f.commissionRatePercent).toFixed(2)}`,
  commissionNetOf100: (f) => `$${(100 - f.commissionRatePercent).toFixed(2)}`,
  // Refund window examples: the deadline is the delivery/confirmation day plus the
  // window, which is what "Day 1 is the day following delivery" works out to.
  refundExampleDeliveredOn: () => exampleDay(DELIVERED_ON),
  refundExampleDeliveredBy: (f) => exampleDay(DELIVERED_ON, Number(f.refundWindowDays)),
  refundExampleConfirmedOn: () => exampleDay(CONFIRMED_ON),
  refundExampleConfirmedBy: (f) => exampleDay(CONFIRMED_ON, Number(f.refundWindowDays)),
};

const TOKEN_PATTERN = /\{(\w+)\}/g;

export const resolveText = (text, figures) =>
  text.replace(TOKEN_PATTERN, (_, key) => {
    const token = TOKENS[key];
    // Documents are static data written in this repo, so an unknown token is an
    // authoring typo. It fails here, and the document test renders every page.
    if (!token) throw new Error(`Unknown legal figure token "{${key}}"`);
    return token(figures);
  });

/** The document with every token resolved — so headings, the table of contents,
 *  the SEO description and the body all read the same number. */
export const resolveDocument = (node, figures) => {
  if (typeof node === 'string') return resolveText(node, figures);
  if (Array.isArray(node)) return node.map((item) => resolveDocument(item, figures));
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolveDocument(v, figures)]));
  }
  return node;
};
