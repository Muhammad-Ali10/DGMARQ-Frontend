// Client-supplied final copy (last updated / effective 10 June 2026). Legal
// wording is verbatim — change it only on the owner's instruction. Straight
// quotes in the source are set as typographic quotes; nothing else is altered.
//
// INCOMPLETE: the source text was cut off inside 10.3 (Prohibited Products), mid
// way through the bullet "Access credentials for accounts not legitimately…".
// The rest of 10.3 and every section after it are still to be added.
export const termsConditions = {
  path: '/terms-conditions',
  seo: {
    title: 'Terms and Conditions | DGMARQ',
    description:
      'The Terms and Conditions that govern access to and use of the DGMARQ marketplace, for buyers, vendors and visitors.',
  },
  kicker: 'Platform agreement',
  title: 'Terms and Conditions',
  summary: [
    'These Terms govern your access to and use of the DGMARQ website, mobile applications and digital marketplace platform, including all purchases of Digital Content made through it.',
  ],
  meta: [
    { label: 'Last updated', value: '10 June 2026' },
    { label: 'Effective', value: '10 June 2026' },
    { label: 'Contact', value: 'support@dgmarq.com', href: 'mailto:support@dgmarq.com' },
  ],
  operator: 'Operated by DGMARQ PTY LTD · ACN 698 682 736 · ABN 76 698 682 736',
  highlights: [
    { icon: 'user', value: '18+', label: 'minimum age to use the Platform', target: 'section-4-1' },
    { icon: 'shield', value: '{buyerProtectionFeePercent}%', label: 'Buyer Protection Fee, shown at checkout', target: 'section-6-2' },
    { icon: 'clock', value: '{refundWindowDays} days', label: 'to report faulty, invalid or undelivered content', target: 'section-9-2' },
    { icon: 'lock', value: '{payoutHoldDays} days', label: 'escrow period before funds reach the Vendor', target: 'section-9-4' },
  ],
  sections: [
    {
      num: 1,
      title: 'About These Terms',
      content: [
        'These Terms and Conditions (“Terms”) govern your access to and use of the DGMARQ website, mobile applications, and digital marketplace platform (“Platform”), including all purchases of Digital Content made through it. These Terms form a binding legal agreement between you and DGMARQ PTY LTD trading as DGMARQ (“DGMARQ”, “we”, “us”, or “our”).',
        'By accessing or using the Platform in any way — whether as a buyer, seller (“Vendor”), or visitor — you acknowledge that you have read, understood, and agree to be bound by these Terms, together with our Privacy Policy and any additional policies or guidelines published on the Platform from time to time.',
        {
          type: 'callout',
          tone: 'warning',
          content: [
            'If you do not agree to these Terms, you must immediately cease all use of the Platform and close any Account you hold.',
          ],
        },
        'DGMARQ reserves the right to amend, update, or replace these Terms at any time. We will post the revised version on the Platform with an updated effective date. For material changes affecting Vendor rights or obligations, we will provide at least 15 days’ prior notice by email. For all other changes, we will post a notice on the Platform. Your continued use of the Platform after the stated notice period constitutes your acceptance of the updated Terms.',
      ],
    },
    {
      num: 2,
      title: 'Definitions',
      content: [
        'In these Terms, unless the context otherwise requires:',
        {
          type: 'definitions',
          items: [
            {
              term: '“DGMARQ” / “we” / “us” / “our”',
              text: 'means DGMARQ PTY LTD trading as DGMARQ (ABN: 76 698 682 736, ACN: 698 682 736).',
            },
            {
              term: '“Platform”',
              text: 'means the DGMARQ website, mobile applications, and associated services available at www.dgmarq.com.',
            },
            {
              term: '“User” / “you”',
              text: 'means any person who accesses or uses the Platform, whether as a buyer, Vendor, or visitor.',
            },
            {
              term: '“Buyer”',
              text: 'means a User who purchases or attempts to purchase Digital Content through the Platform.',
            },
            {
              term: '“Vendor”',
              text: 'means a third-party seller who registers and lists Digital Content for sale through the Platform.',
            },
            {
              term: '“Digital Content”',
              text: 'means game activation keys, gift card codes, subscription vouchers, digital accounts, activation links, top-up credits, in-game items, boosting or coaching services, and any other digital goods or services listed on the Platform.',
            },
            {
              term: '“Transaction”',
              text: 'means any completed or attempted purchase of Digital Content through the Platform.',
            },
            {
              term: '“Buyer Protection Fee”',
              text: 'means the fee charged to Buyers on each Transaction, as displayed at checkout.',
            },
            {
              term: '“Vendor Commission”',
              text: 'means the percentage fee charged by DGMARQ to Vendors on each completed sale.',
            },
            {
              term: '“Escrow Period”',
              text: 'means the period of {payoutHoldDays} calendar days following a completed Transaction during which sale proceeds are held before becoming withdrawable by the Vendor.',
            },
            {
              term: '“Seller Balance” / “Wallet”',
              text: 'means the internal ledger balance held by DGMARQ on behalf of a Vendor, representing accumulated sale proceeds less applicable fees.',
            },
            {
              term: '“ACL”',
              text: 'means the Australian Consumer Law (Schedule 2, Competition and Consumer Act 2010 (Cth)).',
            },
            {
              term: '“EDP”',
              text: 'means Electronic Distribution Platform as defined under the A New Tax System (Goods and Services Tax) Act 1999 (Cth).',
            },
            {
              term: '“KYC”',
              text: 'means Know Your Customer identity verification processes required by DGMARQ or its payment service providers.',
            },
            {
              term: '“AML”',
              text: 'means anti-money laundering obligations under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth).',
            },
            {
              term: '“Business Day”',
              text: 'means a day that is not a Saturday, Sunday, or public holiday in Victoria, Australia.',
            },
            {
              term: '“Intellectual Property”',
              text: 'includes all patents, trademarks, service marks, trade names, copyright, database rights, design rights, trade secrets, and other proprietary rights.',
            },
          ],
        },
      ],
    },
    {
      num: 3,
      title: 'Nature of the Platform',
      content: [
        {
          type: 'subsection',
          num: '3.1',
          title: 'Marketplace Intermediary',
          content: [
            'DGMARQ operates as an online marketplace intermediary. Unless expressly stated otherwise:',
            [
              'Transactions for Digital Content are conducted directly between Buyers and Vendors.',
              'DGMARQ is not the seller or supplier of Digital Content listed by Vendors.',
              'DGMARQ does not take title to, or ownership of, any Vendor-listed Digital Content at any point.',
              'DGMARQ’s role is to provide the technology, infrastructure, payment facilitation, and ancillary services that enable Transactions between Buyers and Vendors.',
            ],
          ],
        },
        {
          type: 'subsection',
          num: '3.2',
          title: 'Electronic Distribution Platform (EDP)',
          content: [
            'DGMARQ is classified as an Electronic Distribution Platform (EDP) under the A New Tax System (Goods and Services Tax) Act 1999 (Cth). As an EDP, DGMARQ is responsible for collecting and remitting GST on supplies of Digital Content made through the Platform to Australian consumers, regardless of whether the relevant Vendor is separately registered for GST in Australia.',
            'By selling through the Platform, Vendors acknowledge and agree that DGMARQ will collect and remit GST on their behalf in respect of sales to Australian consumers, and that Vendors must not separately charge or remit GST on those same supplies.',
          ],
        },
        {
          type: 'subsection',
          num: '3.3',
          title: 'No Endorsement or Warranty of Vendors',
          content: [
            'DGMARQ does not independently verify, endorse, or guarantee any Vendor, or the quality, legality, authenticity, or suitability of any Digital Content listed on the Platform. Product descriptions, images, and other listing information are provided by Vendors and DGMARQ does not independently verify their accuracy.',
            'Users transact with Vendors at their own risk, subject to the consumer protections set out in these Terms and under applicable Australian law.',
          ],
        },
        {
          type: 'subsection',
          num: '3.4',
          title: 'Platform Availability',
          content: [
            'DGMARQ endeavours to keep the Platform available 24 hours a day, 7 days a week. However, we do not guarantee uninterrupted or error-free access. The Platform may be unavailable from time to time due to scheduled maintenance, emergency maintenance, technical issues, or circumstances beyond our reasonable control. DGMARQ will endeavour to provide reasonable notice of planned downtime where practicable.',
            'DGMARQ is not liable for any loss or damage resulting from Platform downtime, interruption of services, or delays in processing Transactions.',
          ],
        },
        {
          type: 'subsection',
          num: '3.5',
          title: 'Third-Party Links and Content',
          content: [
            'The Platform may contain links to third-party websites or services that are not operated by DGMARQ. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites. The inclusion of any link does not imply endorsement by DGMARQ.',
          ],
        },
      ],
    },
    {
      num: 4,
      title: 'Eligibility and Registration',
      content: [
        {
          type: 'subsection',
          num: '4.1',
          title: 'Age Requirements',
          content: [
            'By using the Platform, you represent and warrant that:',
            [
              'You are at least 18 years of age, or the age of majority in your jurisdiction, whichever is higher.',
              'You have the legal capacity to enter into a binding contract in your jurisdiction.',
              'You are not prohibited by any applicable law from purchasing, receiving, or using Digital Content.',
            ],
            'DGMARQ may refuse access to, or terminate the Account of, any person who does not meet these requirements or who provides false information regarding their age or eligibility.',
          ],
        },
        {
          type: 'subsection',
          num: '4.2',
          title: 'Geographic Restrictions',
          content: [
            'The Platform is available to users globally, subject to applicable laws and the restrictions set out in these Terms. Certain Digital Content may not be available in all regions due to licensing restrictions, regional activation requirements, or applicable law. It is your responsibility to verify that any Digital Content you purchase is compatible with your geographic region and platform account before completing a Transaction.',
            'DGMARQ reserves the right to restrict or block access to the Platform from specific jurisdictions at any time, without notice, where required by law or operational necessity.',
          ],
        },
      ],
    },
    {
      num: 5,
      title: 'User Accounts',
      content: [
        {
          type: 'subsection',
          num: '5.1',
          title: 'Account Registration',
          content: [
            'You may register an Account on the Platform to access full functionality, including making purchases, tracking orders, and — if applicable — listing Digital Content as a Vendor. To register, you must provide accurate, current, and complete information as prompted during registration, including your legal name, email address, and any other information requested.',
            'You are required to keep your account information accurate and up to date at all times. If any information you provide changes, you must update your Account promptly.',
            'Each person or entity may hold only one Account unless DGMARQ expressly permits otherwise in writing. Creating multiple Accounts to exploit promotions, discounts, or circumvent Account restrictions is strictly prohibited.',
          ],
        },
        {
          type: 'subsection',
          num: '5.2',
          title: 'Account Security',
          content: [
            'You are solely responsible for:',
            [
              'Maintaining the strict confidentiality of your login credentials, including your password and any two-factor authentication codes.',
              'All activity and Transactions that occur under your Account, whether or not authorised by you.',
              'Any consequences arising from your failure to safeguard your login credentials.',
            ],
            'You must notify DGMARQ immediately at support@dgmarq.com if you suspect or become aware of any unauthorised access to, or use of, your Account. DGMARQ is not liable for any loss or damage arising from unauthorised use of your Account where you have failed to take reasonable steps to secure your credentials.',
            'DGMARQ may, at its discretion, require you to update your password or implement additional security measures if it reasonably suspects a security breach affecting your Account.',
          ],
        },
        {
          type: 'subsection',
          num: '5.3',
          title: 'Account Verification',
          content: [
            'DGMARQ reserves the right to verify the identity of any User at any time, including by requesting government-issued identification, proof of address, or other documentation. Failure to complete a verification request within a reasonable timeframe may result in Account suspension.',
            'For Vendors, identity and business verification (KYC) is mandatory before selling on the Platform. See Section 10 for further details.',
          ],
        },
        {
          type: 'subsection',
          num: '5.4',
          title: 'Account Suspension and Termination',
          content: [
            'DGMARQ may suspend or terminate your Account at any time, with or without notice, where:',
            [
              'There is suspected or confirmed fraudulent or illegal activity on your Account.',
              'You breach any provision of these Terms.',
              'Your Account has been inactive for a period of 24 consecutive months and holds no outstanding balance.',
              'DGMARQ is required to do so by applicable law or a competent authority.',
            ],
            'Where termination is not for urgent reasons, DGMARQ will endeavour to provide 14 days’ prior notice by email.',
            'Upon termination of your Account: (a) your right to access the Platform ceases immediately; (b) any outstanding Transactions will be handled in accordance with these Terms and applicable law; (c) any Vendor balance held in escrow will be processed in accordance with the Vendor Payout provisions in Section 10.',
            'You may close your Account at any time by contacting support@dgmarq.com. Account closure does not affect any legal rights or obligations that have already arisen.',
          ],
        },
      ],
    },
    {
      num: 6,
      title: 'Fees and Payments',
      content: [
        {
          type: 'subsection',
          num: '6.1',
          title: 'Browsing',
          content: [
            'Browsing the Platform is free of charge. You are not required to create an Account to browse listings, though Account registration is required to complete a purchase or list Digital Content as a Vendor.',
          ],
        },
        {
          type: 'subsection',
          num: '6.2',
          title: 'Buyer Fees',
          content: [
            'When you make a purchase, the following fees may apply:',
            {
              type: 'cards',
              items: [
                {
                  icon: 'shield',
                  title: 'Buyer Protection Fee',
                  value: '{buyerProtectionFeePercent}%',
                  text: 'A percentage fee applied to each Transaction to fund DGMARQ’s dispute resolution and buyer protection services. The applicable rate is {buyerProtectionFeePercent}% of the Transaction value and will be clearly displayed at checkout before you confirm your purchase.',
                },
                {
                  icon: 'card',
                  title: 'Checkout Fee',
                  value: '{processingFee}',
                  text: 'A flat fee of {processingFee} per Transaction, applied at checkout.',
                },
              ],
            },
            'All fees are inclusive of any applicable GST. Total costs including fees will always be displayed before you confirm your purchase.',
          ],
        },
        {
          type: 'subsection',
          num: '6.3',
          title: 'Vendor Fees',
          content: [
            'Vendors are charged the following fees on each completed sale:',
            {
              type: 'cards',
              items: [
                {
                  icon: 'check',
                  title: 'Vendor Commission',
                  value: '{commissionRatePercent}%',
                  text: '{commissionRatePercent}% of the gross sale price (inclusive of GST where applicable) on each completed Transaction. This is deducted by DGMARQ from the sale proceeds before remittance to the Vendor’s Wallet.',
                },
                {
                  icon: 'wallet',
                  title: 'Withdrawal Fee',
                  value: '3%',
                  text: 'A fee of 3% of the withdrawal amount applies when a Vendor requests a payout from their Wallet to an external account.',
                },
              ],
            },
            'DGMARQ reserves the right to introduce, modify, or remove fees on 30 days’ written notice to Vendors. Any changes to Vendor fees will not apply to Transactions completed prior to the effective date of the change.',
          ],
        },
        {
          type: 'subsection',
          num: '6.4',
          title: 'DGMARQ Plus Subscription',
          content: [
            'DGMARQ may offer a premium subscription service (“DGMARQ Plus”) that provides Buyers with a discount on Buyer Protection Fees or other benefits, as described on the Platform at the time of subscription. Subscription fees are charged on a recurring basis as specified at the time of sign-up. Subscriptions may be cancelled at any time, with the cancellation taking effect at the end of the current billing period. No partial refunds are available for cancelled subscription periods.',
          ],
        },
        {
          type: 'subsection',
          num: '6.5',
          title: 'Payment Processing',
          content: [
            'DGMARQ uses third-party payment processors to facilitate Transactions, including PayPal and other processors as notified on the Platform. By completing a purchase, you agree to the applicable terms and conditions of the relevant payment processor.',
            'DGMARQ does not store full payment card details on its systems. Payment information is handled directly by the relevant payment processor in accordance with applicable security standards.',
            'Payments are processed in Australian Dollars (AUD) unless otherwise specified. For international Buyers, currency conversion may be applied by your bank or payment provider at their prevailing rates, and DGMARQ is not responsible for any currency conversion fees or exchange rate differences.',
          ],
        },
        {
          type: 'subsection',
          num: '6.6',
          title: 'Failed, Declined, and Reversed Payments',
          content: [
            'If a payment is declined, fails to process, or is subsequently reversed or charged back:',
            [
              'DGMARQ reserves the right to immediately cancel the associated Transaction.',
              'Any Digital Content delivered in connection with the cancelled Transaction may be deactivated, revoked, or rendered unusable where technically possible.',
              'DGMARQ may suspend your Account pending investigation of any failed or reversed payment.',
              'You remain liable for any amounts owed to DGMARQ arising from a reversed payment, including any fees incurred by DGMARQ as a result of the reversal.',
            ],
          ],
        },
        {
          type: 'subsection',
          num: '6.7',
          title: 'Promotional Credits and Discount Codes',
          content: [
            'DGMARQ may, from time to time, issue promotional credits, voucher codes, or discount offers. Such promotions are subject to any specific terms communicated at the time of issue and may be time-limited, single-use, and non-transferable. Promotional credits hold no monetary value and cannot be redeemed for cash. DGMARQ reserves the right to withdraw or modify any promotion at any time without notice.',
          ],
        },
      ],
    },
    {
      num: 7,
      title: 'Tax Obligations',
      content: [
        {
          type: 'subsection',
          num: '7.1',
          title: 'User Tax Responsibility',
          content: [
            'Users are solely responsible for determining and meeting their own tax obligations arising from the purchase of Digital Content through the Platform, including any income tax payable in their jurisdiction. DGMARQ does not provide tax advice to Buyers.',
          ],
        },
        {
          type: 'subsection',
          num: '7.2',
          title: 'GST — DGMARQ as EDP',
          content: [
            'As an EDP under Australian law, DGMARQ collects and remits GST on supplies of Digital Content made through the Platform to Australian consumers. Where GST is collected on a Transaction, the applicable GST amount will be included in the checkout price and reflected in any receipt issued.',
            'Buyers who are GST-registered businesses may be entitled to claim input tax credits for GST paid on Platform purchases, subject to the requirements of the GST Act and upon provision of a valid ABN. Tax receipts are available through the Platform for this purpose.',
          ],
        },
        {
          type: 'subsection',
          num: '7.3',
          title: 'Vendor Tax Responsibility',
          content: [
            'Each Vendor is solely responsible for paying all income tax, capital gains tax, and any other taxes applicable to their sales through the Platform that fall outside DGMARQ’s EDP obligations. DGMARQ’s obligation as an EDP is limited to the collection and remittance of GST on sales of Digital Content to Australian consumers.',
            'Vendors must not separately charge or remit GST on supplies for which DGMARQ has already accounted as the EDP. Vendors should seek independent tax advice regarding all residual tax obligations, including obligations in their jurisdiction of residence.',
          ],
        },
        {
          type: 'subsection',
          num: '7.4',
          title: 'ABN Withholding',
          content: [
            'Where a Vendor is an Australian resident individual or entity and fails to provide a valid Australian Business Number (ABN) during onboarding or upon request, DGMARQ may be required under Australian tax law to withhold 47% of gross payments to that Vendor and remit the withheld amount to the Australian Taxation Office (ATO). Vendors are strongly encouraged to provide a valid ABN to avoid withholding.',
          ],
        },
        {
          type: 'subsection',
          num: '7.5',
          title: 'International Vendor Tax Obligations',
          content: [
            'Vendors located outside Australia are responsible for determining and complying with all tax obligations in their jurisdiction of residence or operation, including any VAT, sales tax, or withholding tax that may apply to their sales through the Platform. DGMARQ may request a completed W-9 (for US persons) or W-8BEN / W-8BEN-E (for non-US foreign persons) as part of onboarding or at any time upon request.',
            'For Vendors based in the European Union or United Kingdom, DGMARQ may collect and report transaction data as required under applicable DAC7 or similar digital platform reporting obligations.',
          ],
        },
      ],
    },
    {
      num: 8,
      title: 'Digital Content — Purchases',
      content: [
        {
          type: 'subsection',
          num: '8.1',
          title: 'What You Are Buying',
          content: [
            'Digital Content on the Platform may include, without limitation:',
            [
              'Game activation keys and codes for platforms including Steam, Epic Games Store, PlayStation Network, Xbox, Nintendo Switch, and others.',
              'Gift card codes for gaming platforms, streaming services, and digital retailers.',
              'Subscription vouchers for gaming services, software applications, and online platforms.',
              'Digital accounts providing access to games or services.',
              'Activation links and direct download access.',
              'In-game currency, items, and cosmetics delivered via top-up or trade.',
              'Gaming services including boosting, coaching, and carry services delivered in-game by the Vendor.',
            ],
            'All Digital Content is delivered electronically. No physical goods will be shipped under any circumstances.',
          ],
        },
        {
          type: 'subsection',
          num: '8.2',
          title: 'Delivery',
          content: [
            'Digital Content is considered delivered once the activation code, account credentials, or other delivery mechanism has been made available to you through your Account on the Platform. It is your responsibility to access and redeem or use the Digital Content promptly following delivery.',
            'Estimated delivery times are indicative only. For certain product types (such as Manual Top-Up or Player Trade services), delivery may be subject to Vendor availability and may take longer. Any estimated timeframes communicated during the purchase process are not guaranteed.',
            'If you do not receive your Digital Content within the stated delivery window, you should contact DGMARQ at support@dgmarq.com or raise a dispute through the Platform’s help centre before the expiry of the {refundWindowDays}-day claim window set out in Section 9.2.',
          ],
        },
        {
          type: 'subsection',
          num: '8.3',
          title: 'Compatibility and Regional Restrictions',
          content: [
            'Game keys and activation codes are redeemed through third-party platforms (e.g., Steam, Epic Games, PlayStation Network, Xbox). DGMARQ and Vendors have no control over the regional restrictions, account requirements, or redemption policies of those platforms.',
            'You are solely responsible for confirming that any Digital Content you purchase:',
            [
              'Is compatible with your gaming platform, device, and software version.',
              'Is valid for activation in your geographic region.',
              'Does not conflict with any existing licences or subscriptions you hold.',
            ],
            'Refunds will not be provided for Digital Content that cannot be activated solely due to regional incompatibility where that incompatibility was disclosed in the product listing or was otherwise reasonably apparent at the time of purchase, except where required by the ACL.',
          ],
        },
        {
          type: 'subsection',
          num: '8.4',
          title: 'Digital Accounts',
          content: [
            'Where Digital Content includes access credentials for a digital account, you acknowledge that:',
            [
              'Use of such account is subject to the terms of service of the relevant platform. It is your responsibility to comply with those terms.',
              'DGMARQ makes no representations as to the longevity, availability, security, or future accessibility of third-party accounts.',
              'Account bans or restrictions imposed by the relevant platform due to your conduct are not grounds for a refund.',
              'Changing the email address, password, or security settings on a purchased account may void any applicable consumer claim if the change prevents DGMARQ from verifying the account’s status.',
            ],
          ],
        },
        {
          type: 'subsection',
          num: '8.5',
          title: 'In-Game Services (Boosting, Coaching, Carry)',
          content: [
            'Certain listings on the Platform offer in-game services such as rank boosting, skill coaching, or gameplay carries, delivered by a Vendor in-game. By purchasing such services, you acknowledge:',
            [
              'Delivery timelines are estimates only and depend on Vendor availability, game queue times, and other variable factors.',
              'Such services may violate the terms of service of the relevant game publisher. DGMARQ makes no representation that these services are permitted by any game publisher and accepts no liability for any consequences, including account bans, arising from your purchase or use of such services.',
              'Refunds for partially delivered in-game services are at DGMARQ’s discretion, subject to the ACL.',
            ],
          ],
        },
        {
          type: 'subsection',
          num: '8.6',
          title: 'Subscriptions and Gift Cards',
          content: [
            'Subscription vouchers and gift cards are subject to the terms and conditions of the issuing platform or service. DGMARQ is not responsible for changes to subscription pricing, service availability, feature sets, or regional availability made by the issuing platform after purchase. Expiry dates on gift cards and vouchers are set by the issuer, not DGMARQ.',
          ],
        },
        {
          type: 'subsection',
          num: '8.7',
          title: 'Pre-Order and Unreleased Content',
          content: [
            'From time to time, Vendors may list pre-order keys or codes for content not yet publicly released. DGMARQ makes no guarantee that pre-order content will be released, or that delivery will occur on any specific date. If a pre-order product is cancelled by its publisher, DGMARQ will liaise with the Vendor to facilitate a refund where possible, subject to the ACL.',
          ],
        },
      ],
    },
    {
      num: 9,
      title: 'Consumer Guarantees, Refunds, and Disputes',
      content: [
        {
          type: 'subsection',
          num: '9.1',
          title: 'Australian Consumer Law',
          content: [
            'If you are a consumer under the ACL, your purchase comes with consumer guarantees that cannot be excluded, restricted, or modified by contract. These include guarantees that Digital Content will:',
            [
              'Be of acceptable quality.',
              'Be fit for the purpose for which it is commonly supplied.',
              'Match any description provided in the listing.',
            ],
            {
              type: 'callout',
              tone: 'success',
              content: [
                'Nothing in these Terms excludes, restricts, or modifies any consumer guarantees under the ACL or any other non-excludable statutory right.',
              ],
            },
          ],
        },
        {
          type: 'subsection',
          num: '9.2',
          title: 'Faulty, Invalid, or Non-Delivered Digital Content',
          content: [
            'If the Digital Content you receive is invalid, already redeemed, does not function as described, or is not delivered within the stated timeframe, you must:',
            [
              'Contact DGMARQ at support@dgmarq.com or raise a dispute through the Platform’s help centre within {refundWindowDays} calendar days of the date of purchase or the stated delivery deadline, whichever is later.',
              'Provide sufficient evidence to support your claim, including screenshots, error messages, or other documentation as reasonably requested by DGMARQ.',
            ],
            'Where a valid consumer claim is substantiated, DGMARQ will, at its election or as required by the ACL:',
            [
              'Facilitate the replacement of the Digital Content by the relevant Vendor; or',
              'Issue a refund to the original payment method for the Transaction amount, including fees.',
            ],
            'DGMARQ may take up to 10 Business Days to investigate and resolve a claim. Complex disputes involving Vendor liability may take longer.',
          ],
        },
        {
          type: 'subsection',
          num: '9.3',
          title: 'Change of Mind',
          content: [
            'Due to the nature of Digital Content — which is digitally delivered and may be immediately redeemable — DGMARQ does not offer refunds for change of mind. This applies once a key, code, or account credential has been delivered to your Account. This policy does not affect any rights you have under the ACL.',
          ],
        },
        {
          type: 'subsection',
          num: '9.4',
          title: 'Escrow and Buyer Protection',
          content: [
            'To protect Buyers, all funds paid in a Transaction are held by DGMARQ in escrow for the Escrow Period ({payoutHoldDays} days) before being released to the Vendor’s Wallet. During this period, Buyers may raise a valid dispute and receive a refund if the Digital Content is demonstrated to be faulty, invalid, or undelivered.',
            'Once the Escrow Period expires without a valid dispute being raised, funds are released to the Vendor’s Wallet. Raising a dispute after the Escrow Period has expired does not automatically entitle you to a refund, but DGMARQ will still investigate claims on a case-by-case basis as required by the ACL.',
          ],
        },
        {
          type: 'subsection',
          num: '9.5',
          title: 'Chargebacks',
          content: [
            'If you initiate a chargeback or payment dispute with your bank or payment provider without first contacting DGMARQ and following the dispute process set out in Section 9.2, DGMARQ reserves the right to:',
            [
              'Suspend your Account pending investigation.',
              'Permanently terminate your Account if a pattern of chargeback abuse is identified.',
              'Recover from you any amounts lost by DGMARQ as a result of a fraudulent or unsubstantiated chargeback, including any chargeback fees imposed on DGMARQ by the payment processor.',
            ],
            'Nothing in this section limits your rights under the ACL or your contractual rights with your payment provider.',
          ],
        },
        {
          type: 'subsection',
          num: '9.6',
          title: 'Dispute Escalation',
          content: [
            'If you are dissatisfied with the outcome of DGMARQ’s internal dispute resolution process, you may:',
            [
              'Contact the Australian Competition and Consumer Commission (ACCC) or your relevant state consumer protection agency.',
              'Seek resolution through the Victorian Civil and Administrative Tribunal (VCAT) or another applicable tribunal or court.',
              'Engage an independent mediator or ombudsman service where applicable.',
            ],
          ],
        },
      ],
    },
    {
      num: 10,
      title: 'Vendor Terms',
      content: [
        {
          type: 'subsection',
          num: '10.1',
          title: 'Vendor Registration and Onboarding',
          content: [
            'To list and sell Digital Content on the Platform, you must register as a Vendor. During registration, you must:',
            [
              'Provide accurate, complete, and current information about your identity and, if applicable, your business.',
              'Complete DGMARQ’s KYC and identity verification process, which may include providing government-issued identification, proof of address, ABN or business registration number, and any other documentation DGMARQ or its payment service providers reasonably require.',
              'Agree to these Terms, the Vendor Commission structure, and all applicable policies.',
            ],
            'DGMARQ reserves the right to decline any Vendor registration application without providing reasons.',
          ],
        },
        {
          type: 'subsection',
          num: '10.2',
          title: 'Vendor Warranties',
          content: [
            'By listing Digital Content on the Platform, each Vendor continuously represents and warrants that:',
            [
              'They have full legal right, title, and authority to list and sell the Digital Content.',
              'The Digital Content is legitimately obtained, genuine, unused (unless clearly disclosed), and free from any third-party liens, claims, or encumbrances.',
              'The Digital Content does not infringe any third-party intellectual property rights, licences, or applicable laws.',
              'All product descriptions, images, and metadata provided are accurate, complete, and not misleading.',
              'The Digital Content was not obtained from charity bundles, promotional giveaways, free-to-play distributions, review copies, or any source that restricts commercial resale.',
              'The Digital Content is not subject to any geographic or platform restrictions that are not clearly disclosed in the listing.',
              'They will fulfil all orders promptly and in accordance with the product listing.',
            ],
          ],
        },
        {
          type: 'subsection',
          num: '10.3',
          title: 'Prohibited Products',
          content: [
            'Vendors must not list, offer, or sell any of the following through the Platform:',
            [
              'Digital Content associated with, or obtained from, sanctioned countries or entities, including Cuba, Iran, North Korea, Russia (except as may be permitted by applicable sanctions relief), Syria, and any other jurisdiction designated by Australia, the United States, the European Union, or the United Nations.',
              'Stolen, fraudulently obtained, unauthorised, or previously redeemed codes.',
              'Digital Content that violates any third-party intellectual property rights or licence terms.',
              'Counterfeit, falsified, or misrepresented products.',
              'Products that are illegal, regulated, or prohibited under any applicable law.',
            ],
          ],
        },
      ],
    },
  ],
  cta: { title: 'Questions about these Terms?', label: 'Contact Support', href: 'mailto:support@dgmarq.com' },
};
