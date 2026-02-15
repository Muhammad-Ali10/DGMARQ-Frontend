export const MarketplaceHero = {
    headline: "Discover the Next-Gen Digital Gaming Marketplace",
    subtext:
        "Secure, scalable, and intelligent platform for buying and selling digital gaming and software globally.",
    ctaPrimary: "Explore Products",
    ctaSecondary: "Become a Seller",
    ctaPrimaryUrl: "/search",
    ctaSecondaryUrl: "/user/become-seller",
};

export const MarketplaceFeaturedProducts = [
    {
        id: "cyber-vault-edition",
        title: "CyberVault: Sovereign Edition",
        category: "PC Games",
        price: 59.99,
        rating: 4.8,
        ratingCount: 12834,
        seller: "NovaGrid Digital",
        sellerId: "novagrid-digital",
        sellerType: "verified",
        badges: ["Top Seller", "Limited Edition"],
        shortDescription:
            "Story-driven sci‑fi RPG with dynamic co-op, instant key delivery, and lifetime license tied to your DGMARQ account.",
    },
    {
        id: "tactical-ops-pass",
        title: "Tactical Ops: Year 1 Pass",
        category: "Game Subscriptions",
        price: 39.99,
        rating: 4.7,
        ratingCount: 9241,
        seller: "Coreline Interactive",
        sellerId: "coreline-interactive",
        sellerType: "publisher",
        badges: ["Trending"],
        shortDescription:
            "Seasonal access, premium battle passes, and ranked rewards delivered as region-aware keys for all supported platforms.",
    },
    {
        id: "creator-suite-pro",
        title: "CreatorSuite Pro License",
        category: "Software & Tools",
        price: 149.0,
        rating: 4.6,
        ratingCount: 3120,
        seller: "Northlight Software",
        sellerId: "northlight-software",
        sellerType: "verified",
        badges: ["Top Seller"],
        shortDescription:
            "Full-stack production toolkit for streamers and creators with automated key fulfillment and multi-device activation.",
    },
    {
        id: "universal-game-credit",
        title: "Universal Game Credit – Global",
        category: "Gift Cards",
        price: 25.0,
        rating: 4.9,
        ratingCount: 21450,
        seller: "Gridline Commerce",
        sellerId: "gridline-commerce",
        sellerType: "pro-merchant",
        badges: ["Trending"],
        shortDescription:
            "Multi-platform, multi-region credit for supported gaming storefronts with real-time FX conversion at checkout.",
    },
    {
        id: "console-essentials-pack",
        title: "Console Essentials Pack",
        category: "Console Keys",
        price: 69.0,
        rating: 4.5,
        ratingCount: 6842,
        seller: "Orbit Forge",
        sellerId: "orbit-forge",
        sellerType: "verified",
        badges: ["Limited Edition"],
        shortDescription:
            "Curated bundle of co-op and competitive titles, optimized for instant delivery across next-gen console ecosystems.",
    },
    {
        id: "system-security-vanguard",
        title: "System Security Vanguard",
        category: "Software & Tools",
        price: 89.0,
        rating: 4.4,
        ratingCount: 4912,
        seller: "Sentinel Labs",
        sellerId: "sentinel-labs",
        sellerType: "verified",
        badges: ["Top Seller"],
        shortDescription:
            "Security suite tuned for gaming rigs with real-time protection, license management, and low-latency optimizations.",
    },
];

export const MarketplaceCategories = [
    {
        id: "pc-games",
        label: "PC Games",
        description:
            "AAA releases, competitive titles, and indie projects delivered as verified digital keys for major PC launchers.",
        productCount: 14820,
        icon: "HiCpuChip",
    },
    {
        id: "console-keys",
        label: "Console Keys",
        description:
            "Region-aware console activations with automated entitlement checks for next-gen and legacy ecosystems.",
        productCount: 6320,
        icon: "HiDevicePhoneMobile",
    },
    {
        id: "software-tools",
        label: "Software & Tools",
        description:
            "Productivity, security, and creative suites designed to support gaming, streaming, and professional workflows.",
        productCount: 2890,
        icon: "HiWrenchScrewdriver",
    },
    {
        id: "subscriptions",
        label: "Game Subscriptions",
        description:
            "Ongoing access passes, content vaults, and cloud gaming plans delivered as subscription-ready digital products.",
        productCount: 1570,
        icon: "HiArrowsRightLeft",
    },
    {
        id: "gift-cards",
        label: "Gift Cards & Credit",
        description:
            "Storefront, wallet, and platform gift cards with instant redemption and multi-currency support.",
        productCount: 4210,
        icon: "HiGiftTop",
    },
    {
        id: "dev-tools",
        label: "Developer & Ops",
        description:
            "Licenses, SDKs, and infrastructure utilities tailored for game studios and digital product vendors.",
        productCount: 940,
        icon: "HiCommandLine",
    },
];

export const MarketplaceSellers = [
    {
        id: "nova-systems",
        name: "Nova Systems Collective",
        productsSold: 485230,
        rating: 4.9,
        isVerified: true,
        badge: "Enterprise Seller",
        description:
            "Specialized in high-volume distribution of AAA titles, Nova Systems runs fully automated fulfillment pipelines with strict latency SLAs.",
    },
    {
        id: "quantum-vault",
        name: "Quantum Vault Studio",
        productsSold: 192340,
        rating: 4.8,
        isVerified: true,
        badge: "Publisher",
        description:
            "A first-party publisher using DGMARQ as its primary distribution backbone, with regional launch strategies baked into each release.",
    },
    {
        id: "pixel-shift",
        name: "PixelShift Merchants",
        productsSold: 132890,
        rating: 4.7,
        isVerified: true,
        badge: "Pro Merchant",
        description:
            "Independent merchant collective focused on bundles and long-tail titles, optimized for discoverability via marketplace analytics.",
    },
    {
        id: "gridline-labs",
        name: "Gridline Labs",
        productsSold: 98450,
        rating: 4.8,
        isVerified: true,
        badge: "Verified Seller",
        description:
            "Offers platform-agnostic game credits, subscriptions, and tools, operating on a tightly monitored risk and payout framework.",
    },
    {
        id: "signal-ops",
        name: "Signal Ops Digital",
        productsSold: 76420,
        rating: 4.6,
        isVerified: true,
        badge: "Growth Seller",
        description:
            "Scaling vendor leveraging structured payouts, dispute tooling, and analytics to grow a focused portfolio of tactical titles.",
    },
];

export const MarketplaceBenefits = {
    buyers: {
        title: "For Buyers",
        items: [
            "Fast access to verified digital products, with every key and license passing automated integrity checks before delivery.",
            "Escrow-protected checkout ensures funds are only released when products are successfully delivered and validated.",
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

export const MarketplacePromotions = [
    {
        id: "launch-bundle",
        title: "Tactical Launch Bundle",
        description:
            "Curated pack of tactical and co-op titles with synchronized regional pricing and instant digital delivery.",
        badge: "Limited Time",
        discountLabel: "Save up to 45%",
        endsAt: "2026-03-01T23:59:59Z",
    },
    {
        id: "creator-stack",
        title: "Creator Stack Upgrade",
        description:
            "End-to-end creator toolkit combining production software, overlays, and security licenses in one bundle.",
        badge: "Bundle Offer",
        discountLabel: "3 licenses, 1 optimized price",
        endsAt: "2026-02-28T23:59:59Z",
    },
    {
        id: "global-credit-wave",
        title: "Global Credit Wave",
        description:
            "Dynamic pricing event for gift cards and multi-platform credits with FX-aware discounts and local payment options.",
        badge: "Trending",
        discountLabel: "Regional incentives active",
        endsAt: "2026-02-20T23:59:59Z",
    },
];

export const MarketplaceChallenges = [
    {
        title: "Instant Products vs. Trust",
        description:
            "Digital products are delivered in seconds, but trust cannot be rushed. Our escrow engine validates every transaction before funds move, aligning speed with security.",
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
            "Funds are held in a programmable escrow layer, released only when delivery and integrity checks succeed, creating a predictable trust model for both sides of the trade.",
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

export const MarketplaceMetrics = [
    { id: "users", value: 35, suffix: "M+", label: "Users" },
    { id: "sellers", value: 2000, suffix: "+", label: "Active Sellers" },
    { id: "countries", value: 120, suffix: "+", label: "Countries" },
    { id: "uptime", value: 99.9, suffix: "%", label: "Platform Uptime" },
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
    subtext: "At DGMarq, security isn't a feature — it's our foundation. Every buyer, seller, and transaction is protected by escrow systems, fraud detection, and secure payment infrastructure.",
    ctaPrimary: "Learn How We Protect You",
    ctaSecondary: "Start Secure Buying",
    ctaPrimaryUrl: "#escrow",
    ctaSecondaryUrl: "/search",
  },
  escrow: {
    intro: "DGMarq operates on a secure escrow model to eliminate marketplace risk.",
    howItWorks: [
      "Buyer submits payment securely.",
      "Funds are held safely in escrow.",
      "Seller delivers the product/service.",
      "Buyer approves delivery.",
      "Funds are released to seller.",
    ],
    benefits: [
      "No upfront payment risk",
      "No fake delivery scams",
      "Full dispute intervention support",
      "Transparent transaction tracking",
    ],
    microcopy: "Your money is never released without your confirmation.",
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
    intro: "Users can activate:",
    items: [
      "Two-Factor Authentication (2FA)",
      "Login activity alerts",
      "Suspicious login notifications",
      "Account recovery protection",
    ],
  },
  faq: [
    { q: "Is my money safe before delivery?", a: "Yes. All payments remain in escrow until you confirm delivery." },
    { q: "What happens if a seller fails to deliver?", a: "You can open a dispute. Funds remain protected." },
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
      items: ["Track active orders", "Approve delivery", "Request revisions", "Cancel eligible transactions"],
    },
    {
      title: "Dispute & Refund Support",
      intro: "If something goes wrong:",
      process: [
        "Open dispute before order completion",
        "Submit supporting evidence",
        "Participate in mediation",
        "Receive resolution decision",
      ],
    },
    {
      title: "Buyer Protection Policy",
      intro: "DGMarq guarantees:",
      items: ["Delivery confirmation control", "Escrow-based fund safety", "Fraud monitoring", "Verified seller listings"],
    },
    {
      title: "DGMarq Plus Support",
      intro: "Premium members receive:",
      items: ["Priority dispute handling", "Faster review processing", "Extended protection coverage", "Dedicated support channel"],
    },
    {
      title: "Account & Security Help",
      items: ["Change password", "Enable 2FA", "Report suspicious activity", "Deactivate account"],
    },
  ],
  faq: [
    { q: "When is payment released to seller?", a: "Payment is released only after you approve delivery. Until then, funds stay in escrow." },
    { q: "How do I cancel an order?", a: "Cancel eligible orders from your dashboard before delivery. Contact support if the seller hasn't delivered." },
    { q: "Can I request refund after approval?", a: "After approval, refunds are handled through our dispute policy. Open a dispute with evidence." },
    { q: "What if seller is unresponsive?", a: "Open a dispute. Our mediation team will review and assist. Funds remain protected in escrow." },
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
    subtext: "Purchase digital products and services with escrow protection, verified sellers, and secure payments — all in just a few steps.",
    ctaPrimary: "Browse Marketplace",
    ctaSecondary: "Create Buyer Account",
    ctaPrimaryUrl: "/marketplace",
    ctaSecondaryUrl: "/register",
  },
  createAccount: {
    intro: "Before purchasing, set up your secure DGMarq account.",
    steps: [
      "Register with email",
      "Verify your identity",
      "Enable Two-Factor Authentication (2FA)",
      "Add secure payment method",
    ],
    microcopy: "Verified buyers receive enhanced protection coverage.",
  },
  browseListings: {
    intro: "Explore curated digital products and services.",
    features: [
      "Seller verification badge",
      "Transparent pricing",
      "Delivery timelines",
      "Seller ratings & reviews",
      "Detailed product descriptions",
    ],
    filters: [
      "Price range",
      "Delivery speed",
      "Seller level",
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
      "Funds move to DGMarq escrow",
    ],
    microcopy: "Your payment is NOT sent directly to the seller.",
  },
  trackOrder: {
    intro: "Inside your dashboard, you can:",
    items: [
      "Monitor delivery timeline",
      "Communicate with seller",
      "Request updates",
      "Upload additional requirements",
    ],
    microcopy: "All communication stays within DGMarq for security.",
  },
  reviewDelivery: {
    intro: "After delivery:",
    steps: [
      "Review submitted files/service",
      "Request revision (if included)",
      "Approve order when satisfied",
    ],
    microcopy: "Funds are only released after approval.",
  },
  dispute: {
    intro: "If delivery does not match expectations:",
    steps: [
      "Open dispute before approval",
      "Provide evidence",
      "DGMarq mediation team reviews",
      "Final resolution issued",
    ],
    microcopy: "Escrow protects your payment throughout the process.",
  },
  buyerProtection: {
    title: "DGMarq Buyer Protection Includes:",
    items: [
      "Escrow-based payments",
      "Fraud monitoring",
      "Verified seller system",
      "Dispute mediation",
      "Transparent policies",
    ],
  },
  faq: [
    { q: "When is payment released?", a: "Payment is released to the seller only after you approve delivery. Funds stay in escrow until then." },
    { q: "What if the seller misses deadline?", a: "Open a dispute. You can request a refund or extension. DGMarq mediation will assist." },
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
      "Buyer approves delivery",
      "Escrow releases funds",
      "Processing window applies",
      "Funds transferred to your account",
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
    { q: "When do I receive payment?", a: "After buyer approval, funds are released from escrow. Standard payout processing is 3–7 business days." },
    { q: "Can buyers cancel after delivery?", a: "No. Once delivery is approved, the sale is complete. Disputes before approval are handled case-by-case." },
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
    subtext: "Start selling digital products and services with escrow-backed payments, verified buyer protection, and transparent dispute handling.",
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
      "Detailed service/product description",
      "Transparent pricing",
      "Delivery timeline",
      "Revision policy",
      "Portfolio samples (if applicable)",
    ],
    bestPractices: {
      title: "Best Practice Tips:",
      items: [
        "Avoid exaggerated claims",
        "Clearly define scope of work",
        "Specify what is NOT included",
      ],
    },
  },
  acceptOrders: {
    intro: "When a buyer places an order:",
    steps: [
      "Payment is secured in escrow",
      "You receive order notification",
      "Begin work within stated timeline",
      "Deliver through platform dashboard",
    ],
    microcopy: "Funds remain protected until buyer approval.",
  },
  deliverGetPaid: {
    intro: "After delivery:",
    steps: [
      "Buyer reviews submission",
      "Buyer approves order",
      "Escrow releases funds",
      "Payout processing begins",
    ],
    microcopy: "Standard processing timeline applies (e.g., 3–7 business days).",
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
    { q: "When do I receive payouts?", a: "After buyer approval, funds are released from escrow. Payouts process within 3–7 business days." },
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

export const TermsConditionsPageData = {
  hero: {
    headline: "DGMarq Terms & Conditions",
    subtext: "These Terms govern your access to and use of the DGMarq marketplace platform.",
    effectiveDate: "Effective Date: [Insert Date]",
  },
  sections: [
    {
      num: 1,
      title: "Acceptance of Terms",
      content: [
        "By accessing or using DGMarq, you agree to comply with these Terms and all applicable laws and regulations.",
        "If you do not agree, you must discontinue use immediately.",
      ],
    },
    {
      num: 2,
      title: "Platform Role & Escrow Service",
      content: [
        "DGMarq operates as:",
        ["A digital marketplace facilitator", "A secure escrow intermediary", "A dispute mediation authority"],
        "DGMarq is not the direct seller or buyer of listed products unless explicitly stated.",
      ],
    },
    {
      num: 3,
      title: "User Eligibility",
      content: [
        "To use DGMarq:",
        ["You must be at least 18 years old", "Provide accurate registration information", "Complete required verification processes"],
        "DGMarq reserves the right to suspend accounts that provide false information.",
      ],
    },
    {
      num: 4,
      title: "Account Responsibilities",
      content: [
        "Users agree to:",
        ["Maintain account confidentiality", "Not share login credentials", "Notify DGMarq of unauthorized access", "Use platform lawfully"],
      ],
    },
    {
      num: 5,
      title: "Payments & Escrow",
      content: [
        "Buyer payments are held in escrow",
        "Funds are released after delivery approval",
        "Platform fees apply per transaction",
        "Refunds are governed by dispute policy",
        "DGMarq may delay payout for security review.",
      ],
    },
    {
      num: 6,
      title: "Dispute Resolution Policy",
      content: [
        "If a dispute arises:",
        ["Parties must attempt resolution via platform", "Evidence submission is required", "DGMarq reviews impartially", "Final decision is binding within platform"],
      ],
    },
    {
      num: 7,
      title: "Prohibited Activities",
      content: [
        "Users may NOT:",
        ["Engage in fraud", "Circumvent escrow system", "Conduct off-platform transactions", "List illegal content", "Misrepresent services"],
        "Violations may result in account termination.",
      ],
    },
    {
      num: 8,
      title: "Limitation of Liability",
      content: [
        "DGMarq is not liable for:",
        ["Indirect or consequential damages", "User-generated content accuracy", "Delays caused by third-party payment providers"],
        "Maximum liability is limited to the transaction amount in dispute.",
      ],
    },
    {
      num: 9,
      title: "Account Suspension & Termination",
      content: [
        "DGMarq may suspend accounts for:",
        ["Policy violations", "Fraud suspicion", "Payment disputes", "Legal compliance requirements"],
      ],
    },
    {
      num: 10,
      title: "Amendments to Terms",
      content: [
        "DGMarq reserves the right to modify Terms at any time. Continued use constitutes acceptance.",
      ],
    },
  ],
  finalCta: {
    headline: "Questions About These Terms?",
    ctaPrimary: "Contact Legal Support",
    ctaPrimaryUrl: "mailto:legal@dgmarq.com",
  },
};

export const PrivacyPolicyPageData = {
  hero: {
    headline: "Privacy & Cookie Policy",
    subtext: "Your data security and privacy are central to DGMarq's operations.",
    effectiveDate: "Effective Date: [Insert Date]",
  },
  sections: [
    {
      num: 1,
      title: "Information We Collect",
      content: [
        "We may collect:",
        ["Account registration data", "Identity verification information", "Payment transaction metadata", "Device & usage data", "Communication records"],
      ],
    },
    {
      num: 2,
      title: "How We Use Information",
      content: [
        "Data is used to:",
        ["Facilitate secure transactions", "Verify user identity", "Prevent fraud", "Improve marketplace experience", "Comply with legal obligations"],
      ],
    },
    {
      num: 3,
      title: "Escrow & Payment Security",
      content: [
        "Payment data is:",
        ["Processed through secure PCI-compliant gateways", "Encrypted using SSL technology", "Tokenized for protection"],
        "DGMarq does not store full payment card details.",
      ],
    },
    {
      num: 4,
      title: "Data Sharing Policy",
      content: [
        "We may share data with:",
        ["Payment processors", "Verification partners", "Legal authorities (if required)", "Fraud prevention services"],
        "We do not sell user data.",
      ],
    },
    {
      num: 5,
      title: "Cookies & Tracking Technologies",
      content: [
        "DGMarq uses cookies to:",
        ["Maintain session security", "Analyze platform performance", "Personalize user experience", "Prevent fraudulent access"],
        "Users may control cookie settings via browser.",
      ],
    },
    {
      num: 6,
      title: "Data Retention",
      content: [
        "Data is retained only as long as necessary for:",
        ["Transaction history", "Legal compliance", "Fraud prevention"],
      ],
    },
    {
      num: 7,
      title: "User Rights",
      content: [
        "Users may:",
        ["Request data access", "Request data correction", "Request deletion (subject to legal limits)", "Withdraw consent"],
        "Requests may be submitted via privacy@dgmarq.com",
      ],
    },
    {
      num: 8,
      title: "Security Measures",
      content: [
        "DGMarq employs:",
        ["Encrypted servers", "Access control restrictions", "Routine security audits", "Multi-layer authentication"],
      ],
    },
    {
      num: 9,
      title: "International Data Transfers",
      content: [
        "If applicable, data may be processed across jurisdictions with appropriate safeguards.",
      ],
    },
    {
      num: 10,
      title: "Policy Updates",
      content: [
        "We may update this Policy periodically. Continued use constitutes acceptance.",
      ],
    },
  ],
  finalCta: {
    headline: "Have Privacy Questions?",
    ctaPrimary: "Contact Our Data Protection Team",
    ctaPrimaryUrl: "mailto:privacy@dgmarq.com",
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
        description: "Funds are held securely until delivery is verified, ensuring complete trust.",
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

export const AboutMetrics = [
    { value: 35, suffix: "M+", label: "Users" },
    { value: 2000, suffix: "+", label: "Sellers" },
    { value: 120, suffix: "+", label: "Countries" },
    { value: 99.9, suffix: "%", label: "Platform Uptime" },
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

