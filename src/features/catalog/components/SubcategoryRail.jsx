import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { subcategoryAPI } from "@services/api";
import SafeImage from "@components/ui/safe-image";
import { resolveTarget } from "@lib/resolveTarget";
import { cn } from "@lib/utils";
import "./SubcategoryRail.css";

// Below this the tiles comfortably fit on screen, so looping them would just
// drag a short row back and forth past empty space. At or above it the track is
// duplicated and the CSS loop takes over.
const LOOP_THRESHOLD = 8;
// Seconds per tile — keeps the apparent speed constant whether the admin has
// enabled 10 subcategories or 40.
const SECONDS_PER_TILE = 3.2;

const Tile = ({ subcategory, ariaHidden }) => {
  // Reuse the shared resolver so the rail builds the same subcategory URL as
  // the mega menu: the SEO route when both slugs exist, the id route otherwise.
  const parentSlug = subcategory.parentCategory?.slug;
  const to = resolveTarget({
    type: "subcategory",
    value: subcategory._id,
    slug: parentSlug && subcategory.slug ? `${parentSlug}/${subcategory.slug}` : "",
  });

  return (
    <Link
      to={to}
      className="sc-tile"
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      <span className="sc-tile-ic">
        {subcategory.image ? (
          <SafeImage src={subcategory.image} alt="" w={96} />
        ) : (
          <Layers className="h-5 w-5 text-[#c3d8ff]" />
        )}
      </span>
      <span className="sc-tile-nm">{subcategory.name}</span>
    </Link>
  );
};

// M15: the homepage subcategory rail. Admin decides which subcategories appear
// (showOnHomepage) and in what order; the list arrives as one cached request.
const SubcategoryRail = () => {
  const { data: subcategories = [] } = useQuery({
    queryKey: ["homepage-subcategories"],
    queryFn: () => subcategoryAPI.getHomepageSubcategories().then((r) => r.data.data || []),
    staleTime: 300000,
  });

  if (subcategories.length === 0) return null;

  const isLooping = subcategories.length >= LOOP_THRESHOLD;

  return (
    <section aria-label="Browse subcategories" className="py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="sc-rail">
          <div
            className={cn("sc-rail-track", isLooping && "is-looping")}
            style={
              isLooping
                ? { animationDuration: `${subcategories.length * SECONDS_PER_TILE}s` }
                : undefined
            }
          >
            {subcategories.map((subcategory) => (
              <Tile key={subcategory._id} subcategory={subcategory} />
            ))}

            {/* Second pass makes the loop seamless. Hidden from assistive tech
                and removed from the tab order so every link is announced once. */}
            {isLooping &&
              subcategories.map((subcategory) => (
                <Tile key={`loop-${subcategory._id}`} subcategory={subcategory} ariaHidden />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubcategoryRail;
