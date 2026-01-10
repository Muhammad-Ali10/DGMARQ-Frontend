import { Link } from "react-router-dom";

const MicrosoftCard = ({ product, width }) => {
  // Get platform name, region name, and key type
  const platformName = product.platform?.name || "Microsoft";
  const regionName = product.region?.name || "Global";
  const keyType = product.productType === "ACCOUNT_BASED" ? "Account" : "Key";

  // Extract main title and subtitle from product name
  // Example: "Microsoft Office 2024 | LTSC Standard (PC)" -> "Microsoft Office 2024" and "| LTSC Standard (PC)"
  const nameParts = product.name.split("|").map((part) => part.trim());
  const mainTitle = nameParts[0] || product.name;
  const subtitle = nameParts.length > 1 ? nameParts.slice(1).join(" | ") : "";

  // Get background image URL
  const backgroundImage =
    product.images && product.images.length > 0 ? product.images[0] : null;

  // Inline style for background image
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
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]120 via-[#2563eb]/10 to-[#60a5fa]/10"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-6 sm:p-8 justify-end">
          {/* Product Title Section */}
          <div>
            <h3 className="text-xl  sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-1.5 sm:mb-2">
              {mainTitle}
            </h3>
            {subtitle && (
              <p className="text-sm sm:text-base md:text-lg text-white/95 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Bottom Info - Brand · Region · Key */}
          <div className="pt-2">
            <p className="text-xs sm:text-sm text-white/85 font-normal">
              {platformName} · {regionName} · {keyType}
            </p>
          </div>
        </div>

        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"></div>
      </div>
    </Link>
  );
};

export default MicrosoftCard;
