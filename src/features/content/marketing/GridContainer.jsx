import React from "react";

export const GridContainer = ({
  className = "",
  children,
  cols = {
    base: 1,
    sm: 1,
    md: 2,
    lg: 3,
  },
}) => {
  const base = cols.base ?? 1;
  const sm = cols.sm ?? base;
  const md = cols.md ?? sm;
  const lg = cols.lg ?? md;

  const colClass = (prefix, value) => {
    const map = {
      1: `${prefix}grid-cols-1`,
      2: `${prefix}grid-cols-2`,
      3: `${prefix}grid-cols-3`,
      4: `${prefix}grid-cols-4`,
    };
    return map[value] || `${prefix}grid-cols-1`;
  };

  const gridClasses = [
    "grid",
    colClass("", base),
    sm ? colClass("sm:", sm) : "",
    md ? colClass("md:", md) : "",
    lg ? colClass("lg:", lg) : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${gridClasses} gap-4 sm:gap-5 lg:gap-6 ${className}`}>
      {children}
    </div>
  );
};

export default GridContainer;

