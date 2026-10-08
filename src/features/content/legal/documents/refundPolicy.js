export const refundPolicy = {
  path: '/refund-policy',
  seo: {
    title: 'Refund Policy | DGMARQ',
    description: 'How refunds, returns and disputes work on the DGMARQ marketplace.',
  },
  kicker: 'Buyers & Vendors',
  title: 'Refund Policy',
  summary: [
    'How refund requests, reviews, decisions and refund methods work for Buyers and Vendors on the dgmarq.com marketplace.',
  ],
  meta: [{ label: 'Effective', value: '18 April 2026' }],
  highlights: [
    { icon: 'calendar', value: '{refundWindowDays} days', label: 'to request a refund after purchase or delivery', target: 'section-3' },
    { icon: 'clock', value: '48 hours', label: 'target time for a refund decision', target: 'section-5-1' },
    { icon: 'wallet', value: 'Instant', label: 'refunds to your dgmarq.com Wallet', target: 'section-6-4' },
    { icon: 'card', value: '3–5', label: 'business days to initiate a refund to your original payment method', target: 'section-6-3' },
  ],
  sections: [
    {
      num: 1,
      title: 'Overview',
      content: [
        'This Refund Policy (“Policy”) applies to all purchases made through the dgmarq.com marketplace platform (“Platform”) and governs the rights and responsibilities of Buyers and Vendors with respect to refunds, returns, and disputes.',
        'dgmarq.com operates as a marketplace connecting independent Vendors with Buyers. By completing a purchase on the Platform, Buyers agree to the terms of this Policy. Vendors are also bound by this Policy as a condition of listing on dgmarq.com.',
        {
          type: 'callout',
          tone: 'highlight',
          title: '{refundWindowDays}-Day Refund Window',
          content: [
            'Buyers are entitled to request a refund within {refundWindowDays} calendar days from the date of purchase or delivery, whichever is later, subject to the eligibility conditions outlined in this Policy.',
          ],
        },
      ],
    },
    {
      num: 2,
      title: 'Refund Eligibility',
      content: [
        {
          type: 'subsection',
          num: '2.1',
          title: 'Eligible Refund Grounds',
          content: [
            'A refund request may be approved where one or more of the following conditions are met:',
            [
              'The item received is significantly different from the product description on the Platform.',
              'The item arrived damaged, defective, or in an unusable condition.',
              'The Vendor failed to fulfil a digital or service-based order without valid reason.',
              'A duplicate or erroneous charge was made to the Buyer’s payment method.',
            ],
          ],
        },
        {
          type: 'subsection',
          num: '2.2',
          title: 'Non-Eligible Refund Grounds',
          content: [
            'Refund requests will not be approved in the following circumstances:',
            [
              'The refund request is submitted after the {refundWindowDays}-day refund window has expired.',
              'The item has been used, consumed, altered, or damaged by the Buyer after receipt.',
              'The Buyer changed their mind about the purchase and the item matches its description.',
              'Digital products or downloadable content that have already been accessed or downloaded, unless they are found to be materially defective.',
              'Items explicitly marked as non-refundable at the time of listing, provided this was clearly disclosed to the Buyer before purchase.',
              'Refund requests submitted without sufficient supporting evidence as required under Section 4.',
            ],
          ],
        },
      ],
    },
    {
      num: 3,
      title: 'The {refundWindowDays}-Day Refund Window',
      content: [
        {
          type: 'subsection',
          num: '3.1',
          title: 'How the Window is Calculated',
          content: [
            'The {refundWindowDays}-day refund window begins on the date the order is marked as delivered or, for digital and service-based orders, on the date of purchase confirmation — whichever is later. Day 1 of the refund window is the day following delivery or purchase confirmation.',
            {
              type: 'callout',
              tone: 'info',
              title: 'Example',
              content: [
                [
                  'If an order is delivered on {refundExampleDeliveredOn}, the refund window closes at the end of {refundExampleDeliveredBy}.',
                  'If a digital order is confirmed on {refundExampleConfirmedOn}, the refund window closes at the end of {refundExampleConfirmedBy}.',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Note',
              content: [
                'Refund requests submitted on Day {refundWindowDays} must be received before 23:59 (platform time) to be considered within the eligible window.',
              ],
            },
          ],
        },
        {
          type: 'subsection',
          num: '3.2',
          title: 'No Extensions',
          content: [
            'dgmarq.com does not routinely extend the {refundWindowDays}-day refund window. Requests received after this period will be declined. Buyers are encouraged to inspect orders promptly upon receipt and raise any concerns within the window.',
          ],
        },
      ],
    },
    {
      num: 4,
      title: 'How to Request a Refund',
      content: [
        {
          type: 'subsection',
          num: '4.1',
          title: 'Refund Request Process',
          content: [
            'To submit a refund request, Buyers must follow the steps below within the {refundWindowDays}-day refund window:',
            {
              type: 'steps',
              items: [
                'Log in to your dgmarq.com account and navigate to your Order History.',
                'Locate the relevant order and select “Request a Refund.”',
                'Select the reason for the refund request from the available options.',
                'Provide a clear written description of the issue and upload any supporting evidence (photographs, screenshots, or other documentation) where applicable.',
                'Submit the request. A confirmation will be sent to the seller and administration’s registered email address.',
              ],
            },
          ],
        },
        {
          type: 'subsection',
          num: '4.2',
          title: 'Supporting Evidence',
          content: [
            'Buyers are strongly encouraged to include supporting evidence with their refund request. For physical items, this may include photographs of the item and its packaging. For digital or service orders, relevant screenshots or correspondence may be required. Requests submitted without adequate supporting evidence may be declined or delayed pending further information.',
          ],
        },
      ],
    },
    {
      num: 5,
      title: 'Refund Review & Decision',
      content: [
        {
          type: 'subsection',
          num: '5.1',
          title: 'Review Process',
          content: [
            'Once a refund request is submitted, dgmarq.com will review the claim in accordance with this Policy. The Vendor may also be contacted to provide their account of the transaction. dgmarq.com aims to issue a decision on refund requests within 48 hours of submission.',
          ],
        },
        {
          type: 'subsection',
          num: '5.2',
          title: 'Possible Outcomes',
          content: [
            'Following review, a refund request will result in one of the following outcomes:',
            {
              type: 'cards',
              items: [
                {
                  tone: 'success',
                  title: 'Full Refund Approved',
                  text: 'The full purchase amount (and buyer protection fee where applicable) is returned to the Buyer using the method(s) described in Section 6.',
                },
                {
                  tone: 'partial',
                  title: 'Partial Refund Approved',
                  text: 'A partial amount is returned based on the nature of the issue and the extent of the Vendor’s responsibility.',
                },
                {
                  tone: 'danger',
                  title: 'Refund Declined',
                  text: 'The request does not meet the eligibility criteria under this Policy and no refund is issued.',
                },
                {
                  tone: 'pending',
                  title: 'Further Information Required',
                  text: 'dgmarq.com requests additional information from the Buyer or Vendor before a decision is made.',
                },
              ],
            },
          ],
        },
        {
          type: 'subsection',
          num: '5.3',
          title: 'Finality of Decision',
          content: [
            'dgmarq.com’s decision on refund requests is final. Where a Buyer believes a decision has been made in error, they may contact dgmarq.com support to request a review, providing new information not previously submitted. dgmarq.com is not obligated to re-open a case where no new evidence is presented.',
          ],
        },
      ],
    },
    {
      num: 6,
      title: 'Refund Processing',
      content: [
        {
          type: 'subsection',
          num: '6.1',
          title: 'Refund Methods Overview',
          content: [
            'Where a refund is approved, dgmarq.com will return the approved amount to the Buyer using the same payment method(s) used for the original purchase, in proportion to the amounts originally paid by each method. This means:',
            [
              'Amounts paid via the dgmarq.com Wallet will be refunded to the Buyer’s dgmarq.com Wallet.',
              'Amounts paid via an external payment method (such as a credit card, debit card, or third-party payment provider) will be refunded to that same external payment method.',
            ],
          ],
        },
        {
          type: 'subsection',
          num: '6.2',
          title: 'Purchases Made Using the dgmarq.com Wallet Only',
          content: [
            'Where a Buyer paid for their purchase entirely using their dgmarq.com Wallet, any approved refund will be returned in full to the Buyer’s dgmarq.com Wallet.',
          ],
        },
        {
          type: 'subsection',
          num: '6.3',
          title: 'Purchases Made Using an External Payment Method Only',
          content: [
            'Where a Buyer completed their purchase entirely using an external payment method and did not use their dgmarq.com Wallet, the Buyer may select their preferred refund method upon approval:',
            {
              type: 'cards',
              items: [
                {
                  icon: 'card',
                  title: 'Option A — Refund to Original Payment Method',
                  text: 'The approved refund amount is returned to the external payment method used at checkout. Processing times may vary depending on the Buyer’s bank or payment provider, but dgmarq.com will initiate the refund within 3–5 business days of the approval decision.',
                },
                {
                  icon: 'wallet',
                  title: 'Option B — Refund to dgmarq.com In-Store Wallet',
                  text: 'The approved refund amount is credited to the Buyer’s dgmarq.com Wallet instantly after the approval decision. Wallet funds can be used toward future purchases on the Platform.',
                },
              ],
            },
            'Buyers must select their preferred refund option directly within the refund section of their dgmarq.com account.',
          ],
        },
        {
          type: 'subsection',
          num: '6.4',
          title: 'dgmarq.com Wallet Refund Processing',
          content: [
            'Refunds credited to the dgmarq.com Wallet are processed instantly upon refund approval and are available for use on the Platform immediately. Wallet funds are non-transferable and cannot be withdrawn as cash unless otherwise permitted under the Platform’s Wallet terms.',
          ],
        },
        {
          type: 'subsection',
          num: '6.5',
          title: 'Protection Fees',
          content: [
            'Platform protection fees charged to Buyers are generally non-refundable. As these fees cover payment processing, dispute protection. Protection Fees are implemented to mitigate as much fraud as possible.',
          ],
        },
        {
          type: 'subsection',
          num: '6.6',
          title: 'Vendor Impact',
          content: [
            'Where a refund is approved and the Vendor is determined to be at fault, the refunded amount will be deducted from the Vendor’s available balance. If the Vendor’s balance is insufficient to cover the refund, dgmarq.com reserves the right to recover the outstanding amount from future earnings or pursue recovery through other means.',
          ],
        },
      ],
    },
    {
      num: 7,
      title: 'Vendor Obligations',
      content: [
        'All Vendors on dgmarq.com are required to honour valid refund requests that fall within this Policy. Vendors must ensure that product listings are accurate, complete, and not misleading. Repeated refund claims against a Vendor’s listings may result in account review, suspension, or removal from the Platform.',
        [
          'Vendors must respond to refund-related queries raised by dgmarq.com within 2 business days.',
          'Vendors must not attempt to dissuade Buyers from exercising their right to request a refund under this Policy.',
          'Vendors are responsible for the accuracy of their product descriptions, images, and stated delivery timeframes.',
        ],
      ],
    },
    {
      num: 8,
      title: 'General Provisions',
      content: [
        {
          type: 'subsection',
          num: '8.1',
          title: 'Policy Updates',
          content: [
            'dgmarq.com reserves the right to update this Refund Policy at any time. Updates will be communicated via the Platform or by email. Continued use of the Platform following notification of changes constitutes acceptance of the revised Policy.',
          ],
        },
        {
          type: 'subsection',
          num: '8.2',
          title: 'Consumer Rights',
          content: [
            'Nothing in this Policy limits or excludes any statutory rights that Buyers may have under applicable consumer protection laws in their jurisdiction. Where local law provides stronger protections than this Policy, those protections will apply.',
          ],
        },
        {
          type: 'subsection',
          num: '8.3',
          title: 'Contact',
          content: [
            'For questions about this Refund Policy or to check the status of a submitted refund request, please contact dgmarq.com support via the Platform or at the contact details provided on dgmarq.com.',
          ],
        },
      ],
    },
  ],
  cta: { title: 'Need help with an order?', label: 'Contact Support', href: '/buyer-support' },
};
