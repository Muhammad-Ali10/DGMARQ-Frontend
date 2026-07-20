import { KeyRound, UserSquare2, Gift, Link2, HelpCircle } from "lucide-react";

// M17: per-product-type buyer notice + badge. Every master product carries a
// productType (delivery model) — the buyer must clearly see WHAT they will
// receive before purchasing. Matches the backend enum:
// LICENSE_KEY | ACCOUNT_BASED | GIFT | ACTIVATION_LINK.
const TYPE_CONFIG = {
  LICENSE_KEY: {
    label: "CD-KEY / License Key",
    Icon: KeyRound,
    accent: "#0e51e2",
    text: "#5b8fff",
    glow: "rgba(14,81,226,0.25)",
    notice:
      "This is a digital edition of the product (CD-KEY). You will receive an activation key to redeem on the relevant platform. No physical item is shipped. Ensure this key is compatible with your region before purchasing.",
  },
  ACCOUNT_BASED: {
    label: "Account",
    Icon: UserSquare2,
    accent: "#d97706",
    text: "#fbbf24",
    glow: "rgba(217,119,6,0.25)",
    notice:
      "This is an ACCOUNT product. You will receive login credentials (email/password) for an account that contains the product. Follow the seller's instructions after purchase and secure the account as advised. The platform where the account is used is shown on the offer.",
  },
  GIFT: {
    label: "Gift Code",
    Icon: Gift,
    accent: "#059669",
    text: "#34d399",
    glow: "rgba(5,150,105,0.25)",
    notice:
      "This is a GIFT CODE. You will receive a redeemable code to claim the product (or balance) on the relevant platform. No physical item is shipped. Ensure the code is compatible with your region before purchasing.",
  },
  ACTIVATION_LINK: {
    label: "Activation Link",
    Icon: Link2,
    accent: "#7c3aed",
    text: "#a78bfa",
    glow: "rgba(124,58,237,0.25)",
    notice:
      "This is an ACTIVATION LINK product. You will receive a link to claim and activate the product — follow it and the included instructions. No physical item is shipped. Check region compatibility before purchasing.",
  },
};

const configFor = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.LICENSE_KEY;

/** Small, prominent pill for the price/buy area ("what am I buying?"). */
export const ProductTypeBadge = ({ type }) => {
  const { label, Icon, accent, text } = configFor(type);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide"
      style={{ border: `1px solid ${accent}`, color: text, background: "rgba(0,0,0,0.25)" }}
    >
      <Icon width={12} height={12} />
      {label}
    </span>
  );
};

/** Prominent notice box under the buy buttons — per-type delivery explanation. */
const ProductTypeNotice = ({ type }) => {
  const { label, accent, text, glow, notice } = configFor(type);
  return (
    <div
      style={{
        background: "#07142E",
        border: `1.5px solid ${accent}`,
        borderRadius: 12,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 18px ${glow}`,
      }}
    >
      <p style={{ color: text, fontWeight: 700, fontSize: 12, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 6 }}>
        <HelpCircle width={13} height={13} /> Important — {label}
      </p>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{notice}</p>
    </div>
  );
};

export default ProductTypeNotice;
