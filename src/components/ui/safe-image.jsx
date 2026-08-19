import { useState } from "react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@lib/placeholders";

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

// Detects whether the segment immediately after /upload/ is already a
// transformation segment (so we don't double-inject). Cloudinary transform
// segments are comma-separated key_value tokens (e.g. "f_auto,q_auto,w_300")
// or a version token like "v1234". A bare public id / folder does not match.
const hasExistingTransform = (afterUpload) => {
  const firstSegment = afterUpload.split("/")[0] || "";
  if (!firstSegment) return false;
  // Already-present transform: contains a known transform key like x_y.
  return /(^|,)[a-z]+_[^/,]+/.test(firstSegment);
};

// Builds a Cloudinary delivery URL with f_auto,q_auto (+ optional width)
// injected right after /upload/. Leaves non-Cloudinary / data URIs untouched
// and never double-injects when a transform is already present.
const buildCloudinaryUrl = (url, width) => {
  if (typeof url !== "string") return url;
  if (url.startsWith("data:")) return url;
  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const prefix = url.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length);
  const afterUpload = url.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length);

  if (hasExistingTransform(afterUpload)) return url;

  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${Math.round(width)}`);

  return `${prefix}${transforms.join(",")}/${afterUpload}`;
};

const isCloudinary = (url) =>
  typeof url === "string" &&
  !url.startsWith("data:") &&
  url.includes(CLOUDINARY_UPLOAD_MARKER);

// Parses a numeric width from either the explicit `w` prop or a numeric
// `width` prop/attribute. Returns null when no usable width is available.
const resolveWidth = (w, width) => {
  const candidate = w ?? width;
  if (candidate === undefined || candidate === null) return null;
  const num =
    typeof candidate === "number"
      ? candidate
      : parseInt(String(candidate), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
};

// AUDIT FIX (PERF-11): last-resort width from an inline style.
//
// Only 19 of ~95 <SafeImage> call sites pass w/width, so everything else
// requested the seller's full-resolution original — commonly 1000px+ — to paint
// a 44px avatar or an 80px cart thumbnail. Many of those sites DO declare their
// size, just as `style={{ width: 44 }}`, which resolveWidth above could not see.
// Reading it here fixes them all at once instead of one prop at a time.
//
// Deliberately strict: only a bare number or an exact `<n>px` string counts.
// '100%', 'auto' and calc() say nothing about the delivered pixel size, so they
// fall through and the original behaviour (no w_ transform) is kept.
const resolveStyleWidth = (style) => {
  const value = style?.width;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const match = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
    if (match) {
      const num = parseFloat(match[1]);
      return num > 0 ? num : null;
    }
  }
  return null;
};

const SafeImage = ({
  src,
  alt,
  fallbackSrc = PRODUCT_IMAGE_PLACEHOLDER,
  hideOnError = false,
  className = "",
  w,
  width,
  style,
  // PERF FIX (FP3): lazy by default — ~80 of 85 usages never passed
  // loading="lazy", so below-the-fold images (home sections, tiles,
  // galleries, review photos) all loaded eagerly. Above-the-fold images
  // (hero slides, header logo) opt out with loading="eager".
  loading = "lazy",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hideOnError && hasError) return null;

  const rawSrc = hasError ? fallbackSrc : src || fallbackSrc;
  const numericWidth = resolveWidth(w, width) ?? resolveStyleWidth(style);

  const resolvedSrc = isCloudinary(rawSrc)
    ? buildCloudinaryUrl(rawSrc, numericWidth)
    : rawSrc;

  let srcSet;
  if (!hasError && isCloudinary(rawSrc) && numericWidth) {
    const x1 = buildCloudinaryUrl(rawSrc, numericWidth);
    const x2 = buildCloudinaryUrl(rawSrc, numericWidth * 2);
    if (x1 !== rawSrc && x2 !== rawSrc) {
      srcSet = `${x1} 1x, ${x2} 2x`;
    }
  }

  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      alt={alt}
      className={className}
      style={style}
      width={width}
      loading={loading}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export default SafeImage;
