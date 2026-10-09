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

export const formatFigure = (figure) => FORMAT[figure.unit](figure.value);

export const formatLiveValue = (figure, value) =>
  figure.unit === 'aud' ? `$${Number(value).toFixed(2)}` : FORMAT[figure.unit](Number(value));
