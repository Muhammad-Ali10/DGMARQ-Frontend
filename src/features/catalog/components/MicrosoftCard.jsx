import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { getPlatformName, getTypeName } from "../utils/productUtils";
import useWishlist from "../hooks/useWishlist";

const MicrosoftCard = ({ product, width }) => {
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
  };

  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);

  const nameParts = product.name.split("|").map((part) => part.trim());
  const mainTitle = nameParts[0] || product.name;
  const subtitle = nameParts.length > 1 ? nameParts.slice(1).join(" | ") : "";

  const backgroundImage =
    product.images && product.images.length > 0 ? product.images[0] : null;

  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(to right, rgba(30, 58, 95, 0.9), rgba(37, 99, 235, 0.7)), url('${backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {
        background: "linear-gradient(to right, #1e3a5f, #2563eb, #60a5fa)",
      };

  return (
    <Link
      to={`/product/${product.slug || product._id}`}
      className={`${width}`}
    >
      <div
        className="relative h-full min-h-[280px] sm:min-h-[320px] md:min-h-[340px] rounded-2xl w-full overflow-hidden"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/20 via-[#2563eb]/10 to-[#60a5fa]/10"></div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          <Heart
            className={`h-5 w-5 ${wishlisted ? "fill-red-500 text-danger" : "text-fg"}`}
          />
        </button>

        <div className="relative z-10 flex flex-col h-full p-6 sm:p-8 justify-end">
          <div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-fg leading-tight mb-1.5 sm:mb-2">
              {mainTitle}
            </h3>
            {subtitle && (
              <p className="text-sm sm:text-base md:text-lg text-fg/95 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          <div className="pt-2">
            <div className="space-y-1 text-xs sm:text-sm text-fg/85 font-normal">
              <p>Platform: <span className="font-semibold">{platformName}</span></p>
              <p>Type: <span className="font-semibold">{typeName}</span></p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"></div>
      </div>
    </Link>
  );
};

export default MicrosoftCard;
