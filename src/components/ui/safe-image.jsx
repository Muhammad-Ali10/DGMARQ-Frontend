import { useState } from "react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../utils/productUtils";

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

const SafeImage = ({
  src,
  alt,
  fallbackSrc = PRODUCT_IMAGE_PLACEHOLDER,
  hideOnError = false,
  className = "",
  w,
  width,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hideOnError && hasError) return null;

  const rawSrc = hasError ? fallbackSrc : src || fallbackSrc;
  const numericWidth = resolveWidth(w, width);

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
      width={width}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export default SafeImage;
