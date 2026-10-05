/**
 * The figures each legal document was DRAFTED with, and the clause each one sits in.
 *
 * The published pages no longer hardcode these: they resolve `{tokens}` against the
 * live admin settings (see figures.js), so one number reaches the summary tile, the
 * clause, the section title and the worked example at once. This table has two jobs:
 *   - the fallback those pages render while the figures load, or if the request
 *     fails — a policy page must never show a gap where a number belongs;
 *   - the reference the admin Settings notice compares against, so changing a fee
 *     surfaces that the published wording has moved away from what was approved.
 *
 * Kept honest by legal.test.jsx, which resolves each document with these values and
 * fails if the cited clause does not then state the number below.
 */
export const PUBLISHED_FIGURES = {
  refundWindowDays: {
    value: 7,
    unit: 'days',
    document: 'Refund Policy',
    clause: '3',
    path: '/refund-policy#section-3',
  },
  payoutHoldDays: {
    value: 10,
    unit: 'days',
    document: 'Terms and Conditions',
    clause: '9.4',
    path: '/terms-conditions#section-9-4',
    caveat: 'The Terms call this the Escrow Period.',
  },
  buyerProtectionFeePercent: {
    value: 10,
    unit: 'percent',
    document: 'Terms and Conditions',
    clause: '6.2',
    path: '/terms-conditions#section-6-2',
  },
  buyerProcessingFeeFixed: {
    value: 0.86,
    unit: 'aud',
    document: 'Terms and Conditions',
    clause: '6.2',
    path: '/terms-conditions#section-6-2',
    caveat:
      'The Terms call this the Checkout Fee and were drafted in AUD; the page shows it in the platform’s base currency.',
  },
  commissionRatePercent: {
    value: 7,
    unit: 'percent',
    document: 'Terms and Conditions',
    clause: '6.3',
    path: '/terms-conditions#section-6-3',
  },
  featuredCommissionPercent: {
    value: 10,
    unit: 'percent',
    document: 'Vendor Terms of Service',
    clause: '3',
    path: '/vendor-terms#section-3',
    caveat: 'Charged on top of the base commission while a listing is featured.',
  },
  withdrawalFeePercent: {
    value: 3,
    unit: 'percent',
    document: 'Terms and Conditions',
    clause: '6.3',
    path: '/terms-conditions#section-6-3',
    caveat:
      'The platform has no flat withdrawal fee: a seller pays the provider fee plus the chargeback absorption fee below.',
  },
};

const FORMAT = {
  days: (v) => `${v} days`,
  percent: (v) => `${v}%`,
  aud: (v) => `AUD $${v.toFixed(2)}`,
};

/** The figure as the published document states it. */
export const formatFigure = (figure) => FORMAT[figure.unit](figure.value);

/** A live setting's value. Money is NOT labelled AUD here — the document quotes
 *  Australian dollars, the platform stores the fee in its own base currency. */
export const formatLiveValue = (figure, value) =>
  figure.unit === 'aud' ? `$${Number(value).toFixed(2)}` : FORMAT[figure.unit](Number(value));
