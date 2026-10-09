import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { subcategoryAPI } from "@services/api";
import SafeImage from "@components/ui/safe-image";
import { resolveTarget } from "@lib/resolveTarget";
import { cn } from "@lib/utils";
import "./SubcategoryRail.css";

const LOOP_THRESHOLD = 8;
const SECONDS_PER_TILE = 3.2;

const Tile = ({ subcategory, ariaHidden }) => {
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
