import { Globe, ShieldCheck, Zap, Gem } from "lucide-react";

// M15: platform trust strip — 4 tiles right under the hero (brand, global
// activation, dispute protection, instant delivery). Static content.
const TILES = [
  {
    icon: Gem,
    title: "DGMARQ",
    text: "Trusted digital marketplace for games, software & more",
    grad: "from-[#172AA4]/40 to-[#0E9FE2]/20",
    iconColor: "text-info",
  },
  {
    icon: Globe,
    title: "Global",
    text: "Keys and accounts available worldwide, region-checked for you",
    grad: "from-emerald-600/30 to-teal-500/10",
    iconColor: "text-success",
  },
  {
    icon: ShieldCheck,
    title: "Dispute Protection",
    text: "Escrow-backed orders with a fair refund & dispute process",
    grad: "from-amber-600/30 to-orange-500/10",
    iconColor: "text-warning",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    text: "Your key arrives by email the moment payment completes",
    grad: "from-fuchsia-600/30 to-purple-500/10",
    iconColor: "text-fuchsia-300",
  },
];

const PlatformTrustGrid = () => (
  <section aria-label="Why buy on DGMARQ" className="py-6">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {TILES.map(({ icon: Icon, title, text, grad, iconColor }) => (
          <div
            key={title}
            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${grad} p-4 sm:p-5 flex items-start gap-3`}
          >
            <div className="shrink-0 rounded-xl bg-black/30 p-2.5">
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-fg">{title}</p>
              <p className="mt-0.5 text-[11px] sm:text-xs leading-snug text-fg/60">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PlatformTrustGrid;
