import { useState } from "react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../utils/productUtils";

const SafeImage = ({
  src,
  alt,
  fallbackSrc = PRODUCT_IMAGE_PLACEHOLDER,
  hideOnError = false,
  className = "",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hideOnError && hasError) return null;

  const resolvedSrc = hasError ? fallbackSrc : src || fallbackSrc;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export default SafeImage;
