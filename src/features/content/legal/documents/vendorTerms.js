// M16 placeholder copy, moved here from lib/data.js unchanged. NOTE FOR OWNER:
// bracketed values are placeholders written to match platform behaviour at the
// time; section 10 of the new Terms and Conditions now also covers Vendors, so
// this page should be reconciled with (or replaced by) the client's final text.
export const vendorTerms = {
  path: '/vendor-terms',
  seo: {
    title: 'Vendor Terms of Service | DGMARQ',
    description: 'Commission, payouts and platform fees — the terms for selling on DGMARQ.',
  },
  kicker: 'Vendors',
  title: 'Vendor Terms of Service',
  summary: ['Commission, payouts and platform fees — the terms that govern selling on DGMARQ.'],
  meta: [{ label: 'Effective', value: '3 July 2026' }],
  sections: [
    {
      num: 1,
      title: 'Becoming a Vendor',
      content: [
        'To sell on DGMARQ you must:',
        [
          'Complete the seller application including identity (KYC) verification',
          'Provide accurate business and contact information',
          'Be approved by the DGMARQ team before listing',
        ],
      ],
    },
    {
      num: 2,
      title: 'Listings & Catalog',
      content: [
        'The product catalog is curated by DGMARQ. Vendors list offers (price, stock, regions) against catalog products.',
        [
          'You may only sell keys and accounts you are legally entitled to distribute',
          'Region availability you declare must be accurate — misdeclared regions are a policy violation',
          'Listings are subject to review and approval',
        ],
      ],
    },
    {
      num: 3,
      title: 'Commission & Platform Fees',
      content: [
        'A commission is charged on every completed sale and deducted automatically:',
        [
          'Base marketplace commission: {commissionRatePercent}% (the exact deduction for any given sale is shown in your earnings dashboard)',
          'Featured-listing surcharge: +{featuredCommissionPercent}% while a listing is featured',
        ],
        'The full breakdown of every deduction is visible per order in your earnings dashboard.',
      ],
    },
    {
      num: 4,
      title: 'Escrow & Payouts',
      content: [
        'Buyer payments are held in escrow. Your earning for an order is scheduled for payout after the hold period ({payoutHoldDays} days) provided no refund or dispute is open on it.',
        [
          'Open refunds freeze only the affected order line, not your whole balance',
          'Payouts are made via PayPal to your verified payout account',
          'DGMARQ may delay a payout for security or fraud review',
        ],
      ],
    },
    {
      num: 5,
      title: 'Refunds & Disputes',
      content: [
        'Vendors participate in the refund process:',
        [
          'You can view buyer refund requests and submit optional feedback for our team',
          'DGMARQ reviews every request and makes the final decision — approve or reject',
          'Approved refunds are deducted from your escrowed earnings for that order',
        ],
        'A consistently high dispute rate may lead to account review, delisting or suspension.',
      ],
    },
    {
      num: 6,
      title: 'Prohibited Conduct',
      content: [
        'The following lead to immediate action against your account:',
        [
          'Selling stolen, fraudulent or region-misdeclared keys',
          'Directing buyers off-platform to avoid fees',
          'Manipulating reviews or ratings',
        ],
      ],
    },
    {
      num: 7,
      title: 'Termination',
      content: [
        'You may stop selling at any time; pending orders and open refunds must still be honored.',
        'DGMARQ may suspend or terminate vendor accounts for policy violations. Escrowed funds for legitimate completed orders are paid out per the normal schedule after review.',
      ],
    },
  ],
  cta: { title: 'Questions about selling?', label: 'Contact Seller Support', href: '/seller-support' },
};
