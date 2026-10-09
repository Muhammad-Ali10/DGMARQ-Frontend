export const MarketplaceHero = {
  headline: "Discover the Next-Gen Digital Gaming Marketplace",
  subtext:
    "Secure, scalable, and intelligent platform for buying and selling digital gaming and software globally.",
  ctaPrimary: "Explore Products",
  ctaSecondary: "Become a Seller",
  ctaPrimaryUrl: "/search",
  ctaSecondaryUrl: "/user/become-seller",
};


export const MarketplaceCategories = [
  {
    id: "pc-games",
    label: "PC Games",
    description:
      "AAA releases, competitive titles, and indie projects delivered as verified digital keys for major PC launchers.",
    icon: "HiCpuChip",
  },
  {
    id: "console-keys",
    label: "Console Keys",
    description:
      "Region-aware console activations with automated entitlement checks for next-gen and legacy ecosystems.",
    icon: "HiDevicePhoneMobile",
  },
  {
    id: "software-tools",
    label: "Software & Tools",
    description:
      "Productivity, security, and creative suites designed to support gaming, streaming, and professional workflows.",
    icon: "HiWrenchScrewdriver",
  },
  {
    id: "subscriptions",
    label: "Game Subscriptions",
    description:
      "Ongoing access passes, content vaults, and cloud gaming plans delivered as subscription-ready digital products.",
    icon: "HiArrowsRightLeft",
  },
  {
    id: "gift-cards",
    label: "Gift Cards & Credit",
    description:
      "Storefront, wallet, and platform gift cards with instant redemption and multi-currency support.",
    icon: "HiGiftTop",
  },
  {
    id: "dev-tools",
    label: "Developer & Ops",
    description:
      "Licenses, SDKs, and infrastructure utilities tailored for game studios and digital product vendors.",
    icon: "HiCommandLine",
  },
];


export const MarketplaceBenefits = {
  buyers: {
    title: "For Buyers",
    items: [
      "Fast access to verified digital products, with every key and license passing automated integrity checks before delivery.",
      "Escrow-protected checkout: the seller's share is held for a set period after delivery, so a faulty key can be refunded before the seller is paid.",
      "Global reach with local payments, supporting multi-currency pricing and region-aware tax handling.",
    ],
  },
  sellers: {
    title: "For Sellers",
    items: [
      "Automated payouts and transparent schedules that adapt to regional banking rails and compliance requirements.",
      "Fraud monitoring, dispute tooling, and chargeback defenses built directly into transaction workflows.",
      "Analytics surfaces that expose real-time performance, pricing elasticity, and customer behavior trends.",
    ],
  },
  platform: {
    title: "For the Platform",
    items: [
      "Infrastructure-driven design that decouples discovery, payments, and fulfillment for resilient global operation.",
      "Globally optimized routing through CDN-backed services, ensuring low-latency access for buyers and sellers.",
      "Security-first posture with encrypted data flows, role-based access, and continuous system health monitoring.",
    ],
  },
};

export const MarketplaceChallenges = [
  {
    title: "Instant Products vs. Trust",
    description:
      "Digital products are delivered in seconds, but trust cannot be rushed. Seller proceeds are held in escrow for a set period after delivery, aligning speed with security.",
  },
  {
    title: "Global Buyers vs. Local Payments",
    description:
      "Buyers expect local payment methods even when purchasing from international sellers. Our payment layer abstracts multi-currency support, tax handling, and banking rails.",
  },
  {
    title: "Fraud Risk at Scale",
    description:
      "Chargebacks, key reselling, and account takeovers can erode margins. We apply real-time behavioral monitoring and automated dispute workflows to contain risk.",
  },
  {
    title: "Independent Seller Limitations",
    description:
      "Small vendors often lack infrastructure. We provide fulfillment pipelines, analytics, and structured payouts that compress the distance between a single seller and global demand.",
  },
];

export const MarketplaceTechnology = [
  {
    id: "encrypted-checkout",
    title: "Encrypted Checkout",
    description:
      "Every transaction is wrapped in end-to-end encryption, from buyer input to settlement, ensuring that sensitive data never leaves hardened, monitored boundaries.",
  },
  {
    id: "escrow-logic",
    title: "Escrow Logic",
    description:
      "Seller proceeds are held for a fixed escrow period after delivery before they can be withdrawn, creating a predictable trust model for both sides of the trade.",
  },
  {
    id: "automated-key-fulfillment",
    title: "Automated Key Fulfillment",
    description:
      "Digital keys and licenses are dispatched via resilient fulfillment queues, handling retries, region locks, and inventory validation without manual intervention.",
  },
  {
    id: "structured-payout-engine",
    title: "Structured Payout Engine",
    description:
      "A configurable payout engine orchestrates payment windows, currencies, and fees, giving sellers clarity while maintaining compliance controls.",
  },
  {
    id: "dispute-resolution",
    title: "Dispute Resolution",
    description:
      "Disputes are processed through a structured workflow with traceable actions, evidence capture, and SLA-aware notifications for all participants.",
  },
  {
    id: "fraud-monitoring-layer",
    title: "Fraud Monitoring Layer",
    description:
      "Our monitoring layer ingests behavioral and transactional signals in real time, flagging anomalies and enforcing mitigations before losses propagate.",
  },
];

export const MarketplaceRoadmap = [
  {
    id: "platform-launch",
    title: "Platform Launch",
    description:
      "Established a secure foundation for digital commerce, focusing on encrypted checkout, verified sellers, and resilient fulfillment pipelines.",
  },
  {
    id: "multi-vendor-expansion",
    title: "Multi-Vendor Expansion",
    description:
      "Scaled from single-seller flows to a multi-vendor ecosystem with shared infrastructure, shared trust layers, and unified discovery.",
  },
  {
    id: "cross-border-integration",
    title: "Cross-Border Integration",
    description:
      "Integrated global payment gateways and tax logic to remove friction between regions, currencies, and regulatory environments.",
  },
  {
    id: "fraud-detection-enhancement",
    title: "Fraud Detection Enhancement",
    description:
      "Deployed advanced monitoring and scoring models that continuously learn from marketplace behavior and emerging fraud vectors.",
  },
  {
    id: "global-scaling-phase",
    title: "Global Scaling Phase",
    description:
      "Optimized the platform to sustain millions of concurrent sessions with predictable latency and capacity across regions.",
  },
];

export const MarketplaceFinalCta = {
  headline: "Join the Next Generation of Digital Commerce",
  subtext:
    "Whether you’re a buyer or seller, the marketplace is engineered to deliver security, speed, and scale for digital products.",
  ctaPrimary: "Become a Seller",
  ctaSecondary: "Explore Marketplace",
  ctaPrimaryUrl: "/user/become-seller",
  ctaSecondaryUrl: "/search",
};



export const SecurityPageData = {
  hero: {
    headline: "Enterprise-Grade Security for Every Transaction",
    subtext: "At DGMarq, security isn't a feature — it's our foundation. Every buyer, seller, and transaction is protected by an escrow hold on seller payouts, fraud checks, and secure payment infrastructure.",
    ctaPrimary: "Learn How We Protect You",
    ctaSecondary: "Start Secure Buying",
    ctaPrimaryUrl: "#escrow",
    ctaSecondaryUrl: "/search",
  },
  escrow: {
    intro: "DGMarq holds every seller's proceeds in escrow to reduce marketplace risk.",
    howItWorks: [
      "Buyer pays securely at checkout.",
      "The key or product is delivered to the buyer's account.",
      "The seller's share is held in escrow for a set period.",
      "Problems reported within the refund window are reviewed before the seller is paid.",
      "After the escrow period, the funds become available to the seller.",
    ],
    benefits: [
      "Seller payouts held during the refund window",
      "Refund requests reviewed by our team",
      "Full dispute intervention support",
      "Transparent transaction tracking",
    ],
    microcopy: "Report a faulty key within the refund window and we review it before the seller is paid.",
  },
  fraudDetection: {
    intro: "We use intelligent monitoring systems to detect suspicious activity.",
    layers: [
      "AI-powered transaction monitoring",
      "Behavioral anomaly detection",
      "IP & location verification",
      "Risk-based payment screening",
    ],
    subtext: "Every transaction is reviewed in real-time to reduce fraud risk.",
  },
  verifiedSeller: {
    intro: "Trust begins with identity verification.",
    includes: [
      "Identity confirmation",
      "Business validation (where applicable)",
      "Payment account verification",
      "Performance review monitoring",
    ],
    subtext: "Verified sellers receive trust badges for transparency.",
  },
  paymentInfrastructure: {
    intro: "DGMarq integrates industry-standard payment security protocols.",
    standards: [
      "SSL encryption (256-bit)",
      "PCI-compliant payment gateways",
      "Tokenized card processing",
      "Multi-layer authentication",
    ],
    microcopy: "We never store full payment card data on our servers.",
  },
  disputeResolution: {
    intro: "In case of disagreements, our resolution system ensures fairness.",
    process: [
      "Buyer raises issue.",
      "Seller response window (48 hours).",
      "DGMarq mediation review.",
      "Evidence evaluation.",
      "Final resolution decision.",
    ],
    subtext: "Transparent, unbiased, structured.",
  },
  dataProtection: {
    intro: "Your data is protected through:",
    items: [
      "Encrypted storage systems",
      "Access control restrictions",
      "Secure server infrastructure",
      "Routine security audits",
    ],
    microcopy: "We comply with global privacy standards.",
  },
  accountTools: {
    intro: "Users can:",
    items: [
      "See every device signed in to the account",
      "Sign out a single device, or all devices at once",
      "Reset a forgotten password by email",
      "Change the account email with a verification code",
    ],
  },
  faq: [
    { q: "Is my money safe after I pay?", a: "Yes. The seller's share is held in escrow for a set period after delivery, so a refund can still be issued if something is wrong." },
    { q: "What happens if a seller fails to deliver?", a: "Request a refund from your order page within the refund window. The seller's payout stays on hold while we review it." },
    { q: "Does DGMarq store credit card details?", a: "No. We use secure tokenized gateways." },
    { q: "How are sellers verified?", a: "Through identity and account verification checks." },
    { q: "Can DGMarq reverse a fraudulent transaction?", a: "Yes, within platform policies and review guidelines." },
  ],
  trust: [
    { icon: "🔐", label: "Escrow Protected Transactions" },
    { icon: "🛡", label: "Verified Sellers" },
    { icon: "💳", label: "Secure Payments" },
    { icon: "⚖", label: "Independent Dispute Handling" },
  ],
  finalCta: {
    headline: "Trade with Confidence on DGMarq",
    subtext: "Buy and sell digital products with complete protection.",
    ctaPrimary: "Start Safe Trading Today",
    ctaPrimaryUrl: "/search",
  },
};

export const ContactPageData = {
  hero: {
    headline: "We're Here to Help",
    subtext: "Our support team is available to assist buyers and sellers with any questions, disputes, or account concerns.",
    ctaPrimary: "Contact Support",
    ctaPrimaryUrl: "#channels",
  },
  channels: [
    { icon: "📩", title: "Email Support", detail: "support@dgmarq.com", sub: "Response Time: Within 24 hours" },
    { icon: "💬", title: "Live Chat", detail: "Available 9AM–6PM (Mon–Fri)", sub: null },
    { icon: "📝", title: "Support Ticket", detail: "Submit structured issue reports via dashboard.", sub: null },
  ],
  buyerAssistance: [
    "Payment issues",
    "Order disputes",
    "Refund processing",
    "Account recovery",
    "Fraud reporting",
  ],
  sellerAssistance: [
    "Listing approval help",
    "Payout delays",
    "Account verification",
    "Policy clarification",
    "Dispute defense",
  ],
  escalation: {
    intro: "If your issue is not resolved:",
    steps: [
      "Submit formal escalation request.",
      "Senior support review.",
      "Compliance team evaluation.",
      "Final resolution within 72 hours.",
    ],
  },
  businessInquiries: {
    title: "Business & Legal Inquiries",
    subtext: "For partnerships or compliance requests:",
    email: "legal@dgmarq.com",
  },
  transparency: {
    title: "Transparency Commitment",
    intro: "We believe in:",
    items: ["Fair handling", "Transparent communication", "Documented decisions", "Accountable resolutions"],
  },
  faq: [
    { q: "How fast do you respond?", a: "We aim to respond within 24 hours. For urgent issues, use the live chat available 9AM–6PM (Mon–Fri)." },
    { q: "Can I call customer support?", a: "We currently offer email and live chat support. For complex issues, submit a support ticket and our team will assist you." },
    { q: "How do I track my ticket?", a: "Track your ticket status in your dashboard under the Support section. You'll receive email updates on progress." },
    { q: "What if my issue is urgent?", a: "Use live chat for urgent matters during business hours, or mark your ticket as high priority when submitting." },
    { q: "Can I escalate my complaint?", a: "Yes. If unresolved, submit a formal escalation request. Senior support will review within 72 hours." },
  ],
  finalCta: {
    headline: "Need Assistance Now?",
    ctaPrimary: "Submit a Support Request",
    ctaPrimaryUrl: "/user/support",
  },
};

export const BuyerSupportPageData = {
  hero: {
    headline: "Buyer Support & Protection Center",
    subtext: "Everything you need to buy safely, resolve issues, and manage your purchases on DGMarq.",
    ctaPrimary: "Browse Help Topics",
    ctaPrimaryUrl: "#help-topics",
  },
  sections: [
    {
      title: "Payment & Checkout Help",
      items: ["Secure payment process", "Escrow explanation", "Accepted payment methods", "Failed payment troubleshooting"],
    },
    {
      title: "Order Management",
      items: ["Track active orders", "View delivered keys", "Request a refund", "Contact the seller"],
    },
    {
      title: "Dispute & Refund Support",
      intro: "If something goes wrong:",
      process: [
        "Request a refund within the refund window",
        "Submit supporting evidence",
        "Our team reviews it with the seller",
        "Receive the resolution decision",
      ],
    },
    {
      title: "Buyer Protection Policy",
      intro: "DGMarq guarantees:",
      items: ["Refund window on eligible purchases", "Escrow hold on seller payouts", "Fraud monitoring", "Verified seller listings"],
    },
    {
      title: "DGMarq Plus Support",
      intro: "Premium members receive:",
      items: ["Priority dispute handling", "Faster review processing", "Extended protection coverage", "Dedicated support channel"],
    },
    {
      title: "Account & Security Help",
      items: ["Change password", "Sign out other devices", "Report suspicious activity", "Delete account"],
    },
  ],
  faq: [
    { q: "When is payment released to seller?", a: "The seller's share is held in escrow for a set period after delivery. A refund requested within the refund window is reviewed before the seller is paid." },
    { q: "How do I cancel an order?", a: "Cancel eligible orders from your dashboard before delivery. Contact support if the seller hasn't delivered." },
    { q: "Can I request a refund after delivery?", a: "Yes, within the refund window. Request it from your order page with evidence of the problem." },
    { q: "What if seller is unresponsive?", a: "Request a refund or open a support ticket. Our team will review and assist while the seller's payout stays on hold." },
    { q: "Is buyer identity protected?", a: "Yes. We protect your data and do not share personal information with sellers beyond what's needed for delivery." },
  ],
  finalCta: {
    headline: "Buy with Confidence",
    ctaPrimary: "Explore Secure Listings Now",
    ctaPrimaryUrl: "/search",
  },
};

export const HowToBuyPageData = {
  hero: {
    headline: "How to Buy Safely on DGMarq",
    subtext: "Purchase digital products with escrow protection, verified sellers, and secure payments — all in just a few steps.",
    ctaPrimary: "Browse Marketplace",
    ctaSecondary: "Create Buyer Account",
    ctaPrimaryUrl: "/marketplace",
    ctaSecondaryUrl: "/register",
  },
  createAccount: {
    intro: "Before purchasing, set up your secure DGMarq account.",
    steps: [
      "Register with email or a social account",
      "Verify your email address",
      "Use a strong, unique password",
      "Pay securely at checkout",
    ],
    microcopy: "You can also check out as a guest and receive your keys by email.",
  },
  browseListings: {
    intro: "Explore curated digital products.",
    features: [
      "Seller verification badge",
      "Transparent pricing",
      "Region and platform details",
      "Seller ratings & reviews",
      "Detailed product descriptions",
    ],
    filters: [
      "Price range",
      "Platform",
      "Region",
      "DGMarq Plus eligible listings",
    ],
    filtersLabel: "Use filters to compare:",
  },
  checkout: {
    intro: "Once ready to purchase:",
    steps: [
      'Click "Buy Now"',
      "Confirm order details",
      "Complete secure payment",
      "Receive your key in your account",
    ],
    microcopy: "Your payment is NOT sent directly to the seller — their share is held in escrow first.",
  },
  trackOrder: {
    intro: "Inside your dashboard, you can:",
    items: [
      "See order status and delivered keys",
      "Communicate with seller",
      "Download your invoice",
      "Request a refund if something is wrong",
    ],
    microcopy: "All communication stays within DGMarq for security.",
  },
  reviewDelivery: {
    intro: "After delivery:",
    steps: [
      "Reveal your key from the order page",
      "Redeem it on the stated platform and region",
      "Report a problem within the refund window",
    ],
    microcopy: "The seller's share stays in escrow until the hold period ends.",
  },
  dispute: {
    intro: "If delivery does not match expectations:",
    steps: [
      "Request a refund within the refund window",
      "Provide evidence",
      "DGMarq team reviews it with the seller",
      "Final resolution issued",
    ],
    microcopy: "The seller's payout stays on hold while your request is reviewed.",
  },
  buyerProtection: {
    title: "DGMarq Buyer Protection Includes:",
    items: [
      "Escrow hold on seller payouts",
      "Fraud monitoring",
      "Verified seller system",
      "Dispute mediation",
      "Transparent policies",
    ],
  },
  faq: [
    { q: "When is payment released?", a: "The seller's share is held in escrow for a set period after delivery, then becomes available to the seller." },
    { q: "What if my key does not work?", a: "Request a refund from your order page within the refund window. DGMarq will review it with the seller." },
    { q: "Can I cancel an order?", a: "Yes, for eligible transactions before delivery. Use your dashboard or contact support." },
    { q: "Is my identity visible to sellers?", a: "Sellers see only necessary order details. Your full identity is protected by our privacy policy." },
    { q: "How long does dispute resolution take?", a: "Typical resolution is 3–7 business days. Complex cases may take longer with full review." },
  ],
  finalCta: {
    headline: "Start Buying with Confidence",
    ctaPrimary: "Explore Secure Listings Today",
    ctaPrimaryUrl: "/search",
  },
};

export const SellerSupportPageData = {
  hero: {
    headline: "Seller Support & Success Center",
    subtext: "Everything you need to list, sell, get paid, and grow securely on DGMarq.",
    ctaPrimary: "Access Seller Help",
    ctaPrimaryUrl: "/seller/support",
  },
  gettingVerified: {
    intro: "Steps to become a trusted seller:",
    steps: [
      "Identity verification",
      "Payment method setup",
      "Profile optimization",
      "Policy agreement",
    ],
    microcopy: "Verification increases buyer trust.",
  },
  listingAssistance: {
    intro: "We help sellers with:",
    items: [
      "Listing optimization guidelines",
      "Pricing strategies",
      "Category placement",
      "SEO tips",
    ],
  },
  payouts: {
    intro: "Seller payout process:",
    steps: [
      "Order is delivered to the buyer",
      "Your share is held for the escrow period",
      "Funds become available to withdraw",
      "Funds transferred to your payout account",
    ],
    microcopy: "Security checks may apply to large transactions.",
  },
  disputeHandling: {
    intro: "If buyer opens dispute:",
    steps: [
      "Provide evidence",
      "Submit delivery proof",
      "Participate in mediation",
      "Await final review decision",
    ],
    microcopy: "DGMarq ensures fair evaluation.",
  },
  performanceMonitoring: {
    intro: "Seller dashboard tracks:",
    items: [
      "Completion rate",
      "Response time",
      "Buyer ratings",
      "Dispute ratio",
    ],
    microcopy: "High performance improves visibility.",
  },
  escalation: {
    intro: "Unresolved issue?",
    steps: [
      "Submit escalation request",
      "Senior review panel",
      "Compliance audit",
      "Final platform ruling",
    ],
  },
  faq: [
    { q: "When do I receive payment?", a: "Your share is held for the escrow period after delivery, then becomes available to withdraw to your payout account." },
    { q: "Can buyers cancel after delivery?", a: "Buyers can request a refund within the refund window. Each request is reviewed, and you can respond with evidence." },
    { q: "What lowers seller ranking?", a: "Low completion rate, slow response time, poor ratings, and high dispute ratio can affect visibility." },
    { q: "How to avoid disputes?", a: "Deliver on time, communicate clearly, provide proof of delivery, and set accurate expectations in listings." },
    { q: "Can DGMarq suspend accounts?", a: "Yes, for policy violations, fraud, or repeated complaints. We follow fair review procedures." },
  ],
  finalCta: {
    headline: "Grow Your Digital Business on DGMarq",
    ctaPrimary: "Start Selling Today",
    ctaPrimaryUrl: "/user/become-seller",
  },
};

export const HowToSellPageData = {
  hero: {
    headline: "How to Sell on DGMarq — Secure, Simple & Scalable",
    subtext: "Start selling digital products with escrow-backed payments, verified buyer protection, and transparent dispute handling.",
    ctaPrimary: "Become a Seller",
    ctaSecondary: "View Seller Requirements",
    ctaPrimaryUrl: "/user/become-seller",
    ctaSecondaryUrl: "#create-account",
  },
  createAccount: {
    intro: "Getting started takes just a few steps:",
    steps: [
      "Register on DGMarq",
      "Complete identity verification",
      "Submit business details (if applicable)",
      "Connect payout method",
      "Agree to marketplace policies",
    ],
    microcopy: "Verification builds buyer trust and increases listing visibility.",
  },
  verification: {
    intro: "DGMarq maintains a trusted marketplace through structured verification.",
    items: [
      "Government-issued ID confirmation",
      "Email & phone verification",
      "Payment account validation",
      "Business registration (if required)",
    ],
    microcopy: "Verified sellers receive a trust badge on their profile.",
  },
  listings: {
    intro: "A successful listing should include:",
    items: [
      "Clear title & category placement",
      "The correct master product, platform and region",
      "Transparent pricing",
      "Enough stock to cover demand",
      "Accurate activation regions",
    ],
    bestPractices: {
      title: "Best Practice Tips:",
      items: [
        "Avoid exaggerated claims",
        "Only list keys you are authorised to sell",
        "Keep stock and regions accurate",
      ],
    },
  },
  acceptOrders: {
    intro: "When a buyer places an order:",
    steps: [
      "Payment is secured at checkout",
      "You receive an order notification",
      "Your uploaded key is delivered automatically",
      "Track the order in your dashboard",
    ],
    microcopy: "Your share is held in escrow for a set period after delivery.",
  },
  deliverGetPaid: {
    intro: "After delivery:",
    steps: [
      "The buyer receives the key",
      "Your share is held for the escrow period",
      "The funds become available to withdraw",
      "Payout processing begins",
    ],
    microcopy: "The escrow period and fees are listed in the Fee Schedule and Vendor Terms.",
  },
  revisionsDisputes: {
    intro: "If issues arise:",
    steps: [
      "Respond promptly",
      "Provide documented proof",
      "Communicate inside DGMarq",
      "Participate in mediation",
    ],
    microcopy: "DGMarq ensures fair review of both parties.",
  },
  growReputation: {
    intro: "Performance metrics include:",
    metrics: [
      "Order completion rate",
      "Response time",
      "Buyer feedback rating",
      "Dispute ratio",
    ],
    benefits: {
      title: "High-performing sellers receive:",
      items: [
        "Increased visibility",
        "Featured placement eligibility",
        "Higher buyer trust",
      ],
    },
  },
  faq: [
    { q: "How long does verification take?", a: "Verification typically takes 1–3 business days. You'll receive an email once approved." },
    { q: "When do I receive payouts?", a: "Your share is held for the escrow period after delivery, then becomes available to withdraw to your payout account." },
    { q: "What happens if a buyer opens dispute?", a: "Provide evidence and delivery proof. DGMarq mediation reviews fairly. Funds stay in escrow during review." },
    { q: "Can DGMarq suspend my account?", a: "Accounts may be suspended for policy violations or fraud. We follow transparent review procedures." },
    { q: "How can I increase sales?", a: "Optimize listings, maintain high ratings, respond quickly, and consider DGMarq Plus for increased visibility." },
  ],
  finalCta: {
    headline: "Start Selling Securely on DGMarq",
    ctaPrimary: "Create Your Seller Account Today",
    ctaPrimaryUrl: "/user/become-seller",
  },
};

export const AboutHero = {
  headline: "Powering the Global Digital Gaming Economy",
  subtext: "Our platform delivers secure, scalable multi-vendor infrastructure for digital goods, connecting millions of buyers and independent sellers worldwide with trust and efficiency.",
  ctaPrimary: "Explore Marketplace",
  ctaSecondary: "Become a Seller",
  ctaPrimaryUrl: "/marketplace",
  ctaSecondaryUrl: "/user/become-seller",
}

export const AboutEcosystem = {
  centerLabel: "Platform Engine",
  buyers: [
    "Instant access to digital products.",
    "Reliable global transactions.",
    "Transparent purchase history.",
    "Secure wallet management.",
  ],
  sellers: [
    "Automated product delivery.",
    "Real-time analytics and insights.",
    "Structured payout system.",
    "Fraud protection and dispute resolution.",
  ],
}

export const AboutChallenges = {
  items: [
    { left: "Instant products.", right: "Delayed trust." },
    { left: "Global buyers.", right: "Local payment barriers." },
    { left: "Digital keys.", right: "High fraud exposure." },
    { left: "Independent sellers.", right: "Limited scale." },
  ],
  subtext: "We built infrastructure — not just a marketplace. Our system ensures trust, speed, and global scalability.",
}

export const AboutTechCards = [
  {
    title: "Encrypted Checkout",
    description: "End-to-end encryption secures all transactions, protecting both buyers and sellers at scale.",
    icon: "HiLockClosed",
  },
  {
    title: "Escrow Logic System",
    description: "Seller proceeds are held for a set escrow period after delivery, so faulty keys can be refunded first.",
    icon: "HiShieldCheck",
  },
  {
    title: "Automated Key Fulfillment",
    description: "Instant and reliable delivery of digital licenses, game keys, and software.",
    icon: "HiKey",
  },
  {
    title: "Structured Payout Engine",
    description: "Streamlined, scheduled payouts keep sellers empowered and informed.",
    icon: "HiCurrencyDollar",
  },
  {
    title: "Dispute & Refund Workflow",
    description: "Transparent, automated dispute resolution and refund management.",
    icon: "HiScale",
  },
  {
    title: "Fraud Monitoring Layer",
    description: "AI-driven detection prevents unauthorized access and reduces financial risk.",
    icon: "HiShieldExclamation",
  },
]

export const AboutRoadmapDetailed = [
  {
    milestone: "Platform Launch",
    description: "Launched the foundation of a secure digital commerce platform, enabling independent sellers to onboard and provide digital products to global buyers efficiently. Focused on system reliability, encryption, and compliance with international standards.",
  },
  {
    milestone: "Multi-Vendor Expansion",
    description: "Introduced support for multiple vendors simultaneously, allowing sellers to scale operations globally. Added structured payouts, automated fulfillment, and real-time analytics dashboards to empower sellers with actionable insights.",
  },
  {
    milestone: "Cross-Border Integration",
    description: "Enabled seamless global transactions, bridging payment gateways across regions. Integrated local currency support, tax compliance tools, and streamlined checkout experience for international buyers.",
  },
  {
    milestone: "Fraud Detection Enhancement",
    description: "Implemented AI-driven fraud monitoring layers, transaction anomaly detection, and automated dispute resolution systems to ensure trust and security for both buyers and sellers on the platform.",
  },
  {
    milestone: "Global Scaling Phase",
    description: "Optimized platform architecture for high concurrency and low latency to support millions of simultaneous users worldwide. Enhanced database sharding, CDN delivery, and system monitoring for resilient performance at scale.",
  },
]

export const AboutPhilosophy = [
  { title: "Security First", description: "All systems designed with top-tier security protocols." },
  { title: "Seller Empowerment", description: "Tools and analytics to maximize revenue and reach." },
  { title: "Transparent Operations", description: "Every transaction is traceable and auditable." },
  { title: "Continuous Innovation", description: "Ongoing updates and enhancements to stay ahead." },
]

export const AboutFinalCta = {
  headline: "Join the Next Generation of Digital Commerce",
  ctaPrimary: "Become a Seller",
  ctaSecondary: "Explore Marketplace",
  ctaPrimaryUrl: "/user/become-seller",
  ctaSecondaryUrl: "/marketplace",
}
