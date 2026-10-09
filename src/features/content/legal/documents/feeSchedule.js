export const feeSchedule = {
  path: '/fee-schedule',
  seo: {
    title: 'Fee Schedule | DGMARQ',
    description: 'A transparent overview of buyer and seller fees on DGMARQ.',
  },
  kicker: 'Buyers & Vendors',
  title: 'Fee Schedule',
  summary: [
    'These Terms and Conditions Terms govern the fees, commissions, handling charges, and payout structures applicable to all users of the dgmarq.com marketplace platform Platform. By registering as a Vendor or completing a purchase as a Buyer on dgmarq.com, you acknowledge that you have read, understood, and agree to be bound by these Terms.',
    'dgmarq.com reserves the right to modify any fees, rates, or charges outlined in these Terms at its sole discretion. Vendors and Buyers will be notified of material changes via email or through in-platform notifications. Continued use of the Platform following such notification constitutes acceptance of the updated Terms.',
  ],
  meta: [{ label: 'Effective', value: '3 July 2026' }],
  sections: [
    {
      num: 1,
      title: 'Commission Structure',
      content: [
        'Vendors who list and sell products or services on dgmarq.com are subject to a commission fee applied to each completed transaction. The commission rate is set and managed exclusively by dgmarq.com and may vary based on product category, vendor tier, promotional agreements, or other factors determined by the Platform.',
        'The applicable commission rate will be clearly displayed within your Vendor dashboard at all times. Key points regarding vendor commission include:',
        [
          'Commission is calculated as a percentage of the total transaction value, excluding applicable taxes.',
          'The commission rate applicable at the time a sale is completed is the rate that will apply to that transaction.',
          'Commission rates are subject to change at the sole discretion of dgmarq.com with reasonable prior notice provided to Vendors.',
          'Vendors are responsible for reviewing their current commission rate in the Vendor dashboard before listing products or services.',
          "Commission is automatically deducted from the Vendor's earnings prior to payout processing.",
        ],
      ],
    },
    {
      num: 2,
      title: 'Commission Calculation',
      content: [
        'Commission is calculated as follows:',
        {
          type: 'callout',
          tone: 'info',
          title: 'Commission Amount = Sale Price × Commission Rate (%)',
          content: [
            'For example, if the current commission rate applicable to your account is {commissionRatePercent}% and a product sells for $100.00, the commission deducted will be {commissionOn100}, resulting in a pre-payout gross earning of {commissionNetOf100} before any applicable payout fees.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Note',
          content: [
            'Commission rates are variable and managed by the platform. Always refer to your Vendor dashboard for the current applicable rate.',
          ],
        },
      ],
    },
    {
      num: 3,
      title: 'Commission Disputes',
      content: [
        "If a Vendor believes a commission has been applied incorrectly, they must raise a formal dispute within 14 calendar days of the transaction date by contacting dgmarq.com support. Disputes raised after this period will not be considered. dgmarq.com's determination on commission disputes is final.",
      ],
    },
    {
      num: 4,
      title: 'Buyer Protection Fee Overview',
      content: [
        'Buyers on dgmarq.com may be charged a Buyer protection fee in addition to the listed product or service price. Buyer protection fees are set and managed by dgmarq.com and are designed to cover operational, processing, and platform maintenance costs associated with facilitating marketplace transactions.',
        'The following conditions apply to dispute protection fees charged to Buyers:',
        [
          'Buyer protection fees are determined and adjusted exclusively by dgmarq.com and may change at any time.',
          'The applicable buyer protection fee will always be displayed clearly at the checkout stage before a Buyer confirms their purchase.',
          'Buyer protection fees are non-refundable except where a transaction is cancelled due to a fault on the part of dgmarq.com or the Vendor.',
          'Buyer protection fees may vary by product category, order value, geographic location, or other criteria as determined by the Platform.',
          'Buyers agree to pay the buyer protection fee displayed at the time of purchase as a condition of completing the transaction.',
        ],
        '**Fee Transparency** — dgmarq.com is committed to transparent pricing. Buyers will never be charged a buyer protection fee that was not disclosed prior to completing a purchase. The total order amount displayed at checkout — including product price, dispute protection fee, and any applicable taxes — represents the final amount charged.',
        '**Refund of Buyer Protection Fees** — buyer protection fees are non-refundable. Any chargeback created by the user in-order to deliberately receive full funds back from a completed order will have their account permanently banned and IP address blocked.',
      ],
    },
    {
      num: 5,
      title: 'Payout Minimum Threshold',
      content: [
        "Payouts to Vendors are subject to a minimum balance requirement. dgmarq.com will only process a payout once the Vendor's available balance meets or exceeds the minimum payout threshold.",
      ],
    },
  ],
  cta: { title: 'Questions about fees?', label: 'Contact Support', href: '/buyer-support' },
};
