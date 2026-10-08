import { PUBLISHED_FIGURES } from './publishedFigures';

export const DRAFTED_FIGURES = {
  refundWindowDays: PUBLISHED_FIGURES.refundWindowDays.value,
  payoutHoldDays: PUBLISHED_FIGURES.payoutHoldDays.value,
  buyerProtectionFee: { type: 'percentage', value: PUBLISHED_FIGURES.buyerProtectionFeePercent.value },
  buyerProcessingFee: { type: 'fixed', value: PUBLISHED_FIGURES.buyerProcessingFeeFixed.value },
  commissionRatePercent: PUBLISHED_FIGURES.commissionRatePercent.value,
  featuredCommissionPercent: PUBLISHED_FIGURES.featuredCommissionPercent.value,
  currency: 'AUD',
};

const FEE_TYPES = new Set(['percentage', 'fixed']);

const isFee = (value) =>
  typeof value === 'object' && FEE_TYPES.has(value.type) && Number.isFinite(Number(value.value));

export const mergeFigures = (data) => {
  if (!data) return DRAFTED_FIGURES;
  const merged = { ...DRAFTED_FIGURES };
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    const drafted = DRAFTED_FIGURES[key];
    if (typeof drafted === 'number' && !Number.isFinite(Number(value))) continue;
    if (typeof drafted === 'object' && !isFee(value)) continue;
    merged[key] = value;
  }
  return merged;
};

const num = (value) => String(Math.round(Number(value) * 100) / 100);

const money = (figures, amount) => `${figures.currency} $${Number(amount).toFixed(2)}`;

const feeAmount = (figures, fee) => (fee.type === 'fixed' ? money(figures, fee.value) : `${num(fee.value)}%`);

const feeBasis = (fee) => (fee.type === 'fixed' ? 'per Transaction' : 'of the Transaction value');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EXAMPLE_YEAR = 2026;
const EXAMPLE_MONTH = 5;
const exampleDay = (day, plusDays = 0) => {
  const date = new Date(Date.UTC(EXAMPLE_YEAR, EXAMPLE_MONTH, day + plusDays));
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
};
const DELIVERED_ON = 1;
const CONFIRMED_ON = 5;

const TOKENS = {
  refundWindowDays: (f) => num(f.refundWindowDays),
  payoutHoldDays: (f) => num(f.payoutHoldDays),
  buyerProtectionFee: (f) => feeAmount(f, f.buyerProtectionFee),
  buyerProtectionFeeTerms: (f) =>
    `${f.buyerProtectionFee.type === 'fixed' ? 'fee' : 'rate'} is ${feeAmount(f, f.buyerProtectionFee)} ${feeBasis(f.buyerProtectionFee)}`,
  commissionRatePercent: (f) => num(f.commissionRatePercent),
  featuredCommissionPercent: (f) => num(f.featuredCommissionPercent),
  processingFee: (f) => feeAmount(f, f.buyerProcessingFee),
  processingFeeTerms: (f) =>
    `${f.buyerProcessingFee.type === 'fixed' ? 'A flat fee' : 'A fee'} of ${feeAmount(f, f.buyerProcessingFee)} ${feeBasis(f.buyerProcessingFee)}`,
  commissionOn100: (f) => `$${(f.commissionRatePercent).toFixed(2)}`,
  commissionNetOf100: (f) => `$${(100 - f.commissionRatePercent).toFixed(2)}`,
  refundExampleDeliveredOn: () => exampleDay(DELIVERED_ON),
  refundExampleDeliveredBy: (f) => exampleDay(DELIVERED_ON, Number(f.refundWindowDays)),
  refundExampleConfirmedOn: () => exampleDay(CONFIRMED_ON),
  refundExampleConfirmedBy: (f) => exampleDay(CONFIRMED_ON, Number(f.refundWindowDays)),
};

const TOKEN_PATTERN = /\{(\w+)\}/g;

export const resolveText = (text, figures) =>
  text.replace(TOKEN_PATTERN, (_, key) => {
    const token = TOKENS[key];
    if (!token) throw new Error(`Unknown legal figure token "{${key}}"`);
    return token(figures);
  });

export const resolveDocument = (node, figures) => {
  if (typeof node === 'string') return resolveText(node, figures);
  if (Array.isArray(node)) return node.map((item) => resolveDocument(item, figures));
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolveDocument(v, figures)]));
  }
  return node;
};
