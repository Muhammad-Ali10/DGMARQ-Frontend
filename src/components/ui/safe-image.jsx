import { useState } from "react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@lib/placeholders";

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";
const NO_FAILURE = {};

const hasExistingTransform = (afterUpload) => {
  const firstSegment = afterUpload.split("/")[0] || "";
  if (!firstSegment) return false;
  return /(^|,)[a-z]+_[^/,]+/.test(firstSegment);
};

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

const resolveWidth = (w, width) => {
  const candidate = w ?? width;
  if (candidate === undefined || candidate === null) return null;
  const num =
    typeof candidate === "number"
      ? candidate
      : parseInt(String(candidate), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
};

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
  loading = "lazy",
  ...props
}) => {
  const [failedSrc, setFailedSrc] = useState(NO_FAILURE);
  const hasError = failedSrc === src;

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
      onError={() => setFailedSrc(src)}
      {...props}
    />
  );
};

export default SafeImage;
