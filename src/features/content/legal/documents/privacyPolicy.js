// Client-supplied final copy (last updated / effective 10 August 2026). Legal
// wording is verbatim — change it only on the owner's instruction.
//
// Numbering: the source opens with "1. Contents", which pushed every heading one
// number past its own cross-references ("see Section 12" means Cookies, which the
// source headed 13). The contents list is now the page's table of contents, so
// sections run 1–15 and every in-text reference lands on the right clause.
export const privacyPolicy = {
  path: '/privacy-policy',
  seo: {
    title: 'Privacy and Cookie Policy | DGMARQ',
    description:
      'How DGMARQ collects, uses, stores, discloses and protects your personal information, and how we use cookies.',
  },
  kicker: 'Your data',
  title: 'Privacy & Cookie Policy',
  summary: [
    'DGMARQ PTY LTD (ACN 698 682 736, ABN 76 698 682 736) (“DGMARQ”, “we”, “us”, “our”) operates the DGMARQ marketplace at dgmarq.com (the “Platform”). This policy explains how we collect, use, store, disclose and protect your personal information, and how we use cookies and similar technologies.',
    'We handle personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). Where the General Data Protection Regulation (GDPR) or the UK GDPR applies to you, we also comply with those obligations.',
    'If you do not agree with this policy, please do not use the Platform.',
  ],
  meta: [
    { label: 'Last updated', value: '10 August 2026' },
    { label: 'Effective', value: '10 August 2026' },
    { label: 'Contact', value: 'privacy@dgmarq.com', href: 'mailto:privacy@dgmarq.com' },
  ],
  highlights: [
    { icon: 'shield', value: 'Never sold', label: 'We do not sell your personal information', target: 'section-5' },
    { icon: 'clock', value: '30 days', label: 'to respond to a privacy rights request', target: 'section-9' },
    { icon: 'archive', value: '7 years', label: 'minimum retention for AML/CTF records', target: 'section-7' },
    { icon: 'user', value: '18+', label: 'the Platform is not intended for minors', target: 'section-11' },
  ],
  sections: [
    {
      num: 1,
      title: 'About us and contact details',
      content: [
        'DGMARQ PTY LTD is an Australian proprietary company registered in Victoria. We operate an online intermediary marketplace where sellers list digital game keys, accounts, gifts, activation links, top-ups and related digital goods for purchase by buyers.',
        {
          type: 'contacts',
          items: [
            { icon: 'mail', label: 'Privacy contact', value: 'privacy@dgmarq.com', href: 'mailto:privacy@dgmarq.com' },
          ],
        },
      ],
    },
    {
      num: 2,
      title: 'What personal information we collect',
      content: [
        'The categories of personal information we may collect include:',
        [
          '**Account information** — name, email address, password (hashed), username, country, date of birth (where required), profile details.',
          '**Identity and verification information (sellers and high-value buyers)** — government-issued ID (passport, driver’s licence), proof of address, selfie/liveness check, tax identification numbers, business registration details (for business sellers), and bank/payout account details. We collect this to meet our anti-money-laundering and counter-terrorism financing (AML/CTF) obligations and our payment partners’ Know-Your-Customer (KYC) requirements.',
          '**Transaction information** — products purchased or sold, prices, fees paid, payment method, transaction dates, dispute and refund history, internal wallet balances and ledger entries.',
          '**Payment information** — card details and PayPal account details are collected and processed directly by our payment partners (e.g. PayPal, iPayouts) and are not stored on DGMARQ servers. We receive limited information such as the last four digits of the card, card type and authorisation tokens.',
          '**Communications** — messages you send through the Platform (buyer–seller chat, support tickets), emails, and feedback or reviews you submit.',
          '**Device and technical information** — IP address, device identifiers, browser type and version, operating system, language, referring URL, pages visited, time spent, and similar telemetry.',
          '**Location information** — general location derived from your IP address. We do not collect precise GPS location.',
          '**Fraud and risk signals** — device fingerprints, login patterns, behavioural signals, and information from third-party fraud-prevention services.',
          '**Cookies and similar technologies** — see Section 12.',
        ],
        'We do not knowingly collect sensitive information (as defined in the Privacy Act) unless it is necessary and you have consented.',
      ],
    },
    {
      num: 3,
      title: 'How we collect personal information',
      content: [
        'We collect personal information:',
        [
          '**Directly from you** when you register, list a product, place an order, complete KYC, contact support, or otherwise interact with the Platform.',
          '**Automatically** through cookies, server logs and analytics when you visit the Platform.',
          '**From third parties** including our payment partners (iPayouts, PayPal), KYC and fraud-prevention providers, identity verification services, public registers (e.g. ASIC), and analytics providers.',
        ],
        'Where it is reasonable and practicable, we collect personal information directly from you.',
      ],
    },
    {
      num: 4,
      title: 'Why we collect, use and disclose your information',
      content: [
        'We use your personal information to:',
        [
          'create and administer your account;',
          'list, process, fulfil and settle transactions, including holding seller funds in escrow and releasing payouts;',
          'verify your identity and meet our AML/CTF, sanctions, tax and other legal obligations;',
          'detect, investigate and prevent fraud, abuse, chargebacks, account takeover and breaches of our terms;',
          'handle disputes, refunds, claims under our buyer protection program and chargebacks;',
          'provide customer support;',
          'send transactional communications (order confirmations, payout notices, security alerts);',
          'send marketing communications where permitted (see Section 10);',
          'improve and develop the Platform, including analytics, testing and research;',
          'comply with applicable laws and respond to lawful requests from regulators, courts and law enforcement.',
        ],
        {
          type: 'callout',
          tone: 'info',
          content: [
            '**Lawful bases (GDPR/UK GDPR):** where these regimes apply, we rely on (a) performance of a contract with you, (b) compliance with our legal obligations, (c) our legitimate interests in operating, securing and improving the Platform, and (d) your consent (for marketing and non-essential cookies).',
          ],
        },
      ],
    },
    {
      num: 5,
      title: 'Who we share your information with',
      content: [
        'We share personal information with:',
        [
          '**Payment partners** — iPayouts, PayPal, and any successor or additional partners we engage, for payment processing, payouts and KYC.',
          '**Identity and fraud-prevention providers** — third parties that help us verify identities, screen for sanctions, and detect fraud.',
          '**Hosting and infrastructure providers** — VPS hosting',
          '**Customer support and operations contractors** — including teams working directly with our company.',
          '**Professional advisers** — accountants, bookkeepers, auditors, and lawyers.',
          '**Buyers and sellers** — limited information (such as username and order details) is shared with the counterparty to a transaction.',
          '**Regulators, law enforcement and courts** — where required by law, including AUSTRAC, the Australian Taxation Office, ASIC, and overseas equivalents in respect of lawful requests.',
          '**Acquirers and successors** — if we are involved in a merger, acquisition, restructure or sale of assets, personal information may be transferred as part of that transaction.',
        ],
        { type: 'callout', tone: 'success', content: ['**We do not sell your personal information.**'] },
      ],
    },
    {
      num: 6,
      title: 'International data transfers',
      content: [
        'DGMARQ is based in Australia. Some recipients of your personal information are located outside Australia, including:',
        [
          'The United States, European Union, United Kingdom, and other jurisdictions where our payment partners, hosting, and SaaS providers operate.',
        ],
        'Where we disclose personal information overseas, we take reasonable steps to ensure the overseas recipient handles it in a manner consistent with the APPs, including through contractual obligations. Where GDPR applies, we rely on appropriate safeguards such as Standard Contractual Clauses.',
      ],
    },
    {
      num: 7,
      title: 'How long we keep your information',
      content: [
        'We keep personal information only for as long as necessary for the purposes set out in this policy, including:',
        [
          '**AML/CTF records** — at least 7 years from the end of the customer relationship or the date of the transaction, as required under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth).',
          '**Tax and accounting records** — at least 5 years as required by Australian tax law.',
          '**Account and transaction records** — for the life of your account and a reasonable period afterwards to handle disputes, chargebacks, and legal claims.',
          '**Marketing data** — until you opt out, after which we retain a minimal suppression record.',
        ],
        'When we no longer need personal information, we will destroy or de-identify it.',
      ],
    },
    {
      num: 8,
      title: 'How we keep your information secure',
      content: [
        'We use a combination of technical and organisational measures to protect personal information, including encrypted connections (TLS), hashed passwords, access controls, logging, network segregation, and contractual obligations on our service providers. No system is perfectly secure, and we cannot guarantee the security of information transmitted to or from the Platform.',
        'If we become aware of a data breach that is likely to result in serious harm, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) in accordance with the Notifiable Data Breaches scheme.',
      ],
    },
    {
      num: 9,
      title: 'Your rights and choices',
      content: [
        'Subject to applicable law, you have the right to:',
        [
          '**Access** the personal information we hold about you.',
          '**Correct** inaccurate or outdated information.',
          '**Request deletion** of your information (subject to our legal retention obligations, including AML/CTF).',
          '**Object to or restrict** certain processing.',
          '**Data portability** — receive a copy of certain information in a portable format (where GDPR applies).',
          '**Withdraw consent** at any time where we rely on consent.',
          '**Lodge a complaint** — see Section 15.',
        ],
        'To exercise these rights, contact privacy@dgmarq.com. We may need to verify your identity before acting on your request. We will respond within 30 days, or such other period as required by law.',
      ],
    },
    {
      num: 10,
      title: 'Direct marketing',
      content: [
        'We may send you marketing communications about DGMARQ products, promotions and seller programs. You can opt out at any time by clicking “unsubscribe” in any marketing email, adjusting your notification preferences in your account, or contacting privacy@dgmarq.com. Transactional and account communications are not marketing and cannot be opted out of while you have an active account.',
      ],
    },
    {
      num: 11,
      title: 'Children',
      content: [
        'The Platform is not intended for use by anyone under 18. We do not knowingly collect personal information from people under 18. If you believe a child has provided us with personal information, please contact us and we will take reasonable steps to delete it.',
      ],
    },
    {
      num: 12,
      title: 'Cookies and similar technologies',
      content: [
        {
          type: 'subsection',
          num: '12.1',
          title: 'What are cookies',
          content: [
            'Cookies are small text files stored on your device when you visit a website. We also use similar technologies such as local storage, pixels, tags and SDKs. In this policy, “cookies” refers to all of these.',
          ],
        },
        {
          type: 'subsection',
          num: '12.2',
          title: 'Categories of cookies we use',
          content: [
            {
              type: 'table',
              caption: 'Categories of cookies DGMARQ uses',
              columns: ['Category', 'Purpose', 'Examples'],
              rows: [
                [
                  'Strictly necessary',
                  'Required for the Platform to function — login, session, security, fraud prevention, cart, checkout. Cannot be disabled.',
                  'session ID, CSRF token, authentication token',
                ],
                ['Functional', 'Remember your preferences (language, region, display settings).', 'locale, region, theme'],
                [
                  'Analytics',
                  'Help us understand how the Platform is used so we can improve it. Aggregated and pseudonymous where possible.',
                  'Google Analytics, internal telemetry',
                ],
                [
                  'Marketing',
                  'Used to measure and improve advertising on third-party platforms, and to show you relevant ads.',
                  'Meta Pixel, Google Ads conversion tags',
                ],
              ],
            },
          ],
        },
        {
          type: 'subsection',
          num: '12.3',
          title: 'Specific cookies',
          content: [
            'A current list of cookies, their providers, purposes and durations is available at dgmarq.com/cookies. We update this list as cookies change.',
          ],
        },
        {
          type: 'subsection',
          num: '12.4',
          title: 'Managing cookies',
          content: [
            'You can manage non-essential cookies through our cookie banner and preference centre on the Platform. You can also block or delete cookies through your browser settings. Disabling strictly necessary cookies will prevent parts of the Platform from working.',
            'For more information about cookies and how to manage them, see [allaboutcookies.org](https://www.allaboutcookies.org).',
          ],
        },
        {
          type: 'subsection',
          num: '12.5',
          title: 'Do Not Track',
          content: ['The Platform does not currently respond to “Do Not Track” browser signals.'],
        },
      ],
    },
    {
      num: 13,
      title: 'Third-party links and services',
      content: [
        'The Platform may contain links to third-party websites and services (including sellers’ external resources). We are not responsible for the privacy practices of those third parties. We encourage you to read their privacy policies.',
      ],
    },
    {
      num: 14,
      title: 'Changes to this policy',
      content: [
        'We may update this policy from time to time. The “Last updated” date at the top of this page indicates when it was last changed. Where changes are material, we will notify you through the Platform or by email before they take effect. Continued use of the Platform after the effective date constitutes acceptance of the updated policy.',
      ],
    },
    {
      num: 15,
      title: 'How to contact us or make a complaint',
      content: [
        'If you have a question, request or complaint about this policy or our handling of your personal information:',
        {
          type: 'contacts',
          items: [
            { icon: 'mail', label: 'Email', value: 'privacy@dgmarq.com', href: 'mailto:privacy@dgmarq.com' },
            { icon: 'pin', label: 'Post', value: 'Privacy Officer, DGMARQ PTY LTD, Melbourne VIC, Australia' },
          ],
        },
        'We aim to acknowledge complaints within 5 business days and resolve them within 30 days.',
        'If you are not satisfied with our response, you can lodge a complaint with:',
        {
          type: 'contacts',
          items: [
            {
              icon: 'landmark',
              label: 'Australia',
              value: 'Office of the Australian Information Commissioner (OAIC)',
              links: [
                { label: 'oaic.gov.au', href: 'https://www.oaic.gov.au' },
                { label: '1300 363 992', href: 'tel:1300363992' },
              ],
            },
            { icon: 'globe', label: 'EU/EEA', value: 'Your local data protection authority' },
            {
              icon: 'landmark',
              label: 'United Kingdom',
              value: 'Information Commissioner’s Office (ICO)',
              links: [{ label: 'ico.org.uk', href: 'https://ico.org.uk' }],
            },
          ],
        },
      ],
    },
  ],
  cta: { title: 'Have privacy questions?', label: 'Email our Privacy Officer', href: 'mailto:privacy@dgmarq.com' },
};
