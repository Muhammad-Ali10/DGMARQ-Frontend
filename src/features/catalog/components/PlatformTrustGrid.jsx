import { useStorefrontConfig } from "@hooks/useStorefrontConfig";
import SafeImage from "@components/ui/safe-image";
import { getMenuIcon } from "@lib/menuIcons";

const ACCENTS = [
  { grad: "from-[#172AA4]/40 to-[#0E9FE2]/20", iconColor: "text-info" },
  { grad: "from-emerald-600/30 to-teal-500/10", iconColor: "text-success" },
  { grad: "from-amber-600/30 to-orange-500/10", iconColor: "text-warning" },
  { grad: "from-fuchsia-600/30 to-purple-500/10", iconColor: "text-fuchsia-300" },
];

const selectTrustTiles = (config) => config?.trustTiles || [];

const PlatformTrustGrid = () => {
  const { data: tiles = [] } = useStorefrontConfig(selectTrustTiles);

  if (tiles.length === 0) return null;

  return (
    <section aria-label="Why buy on DGMARQ" className="py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {tiles.map((tile, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            const Icon = getMenuIcon(tile.icon);

            return (
              <div
                key={tile.title || index}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br ${accent.grad} p-4 sm:p-5 flex items-start gap-3`}
              >
                <div className="shrink-0 rounded-xl bg-black/30 p-2.5">
                  {tile.image ? (
                    <SafeImage
                      src={tile.image}
                      alt=""
                      w={64}
                      className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                    />
                  ) : (
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${accent.iconColor}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-fg">{tile.title}</p>
                  {tile.text && (
                    <p className="mt-0.5 text-[11px] sm:text-xs leading-snug text-fg/60">
                      {tile.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlatformTrustGrid;
