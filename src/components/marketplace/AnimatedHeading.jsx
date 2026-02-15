import React from "react";

export const AnimatedHeading = ({
  eyebrow,
  title,
  highlight,
  description,
  align = "left",
}) => {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">
          {eyebrow}
        </span>
      )}
      <h2 className="relative text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl lg:text-[2.5rem]">
        <span className="relative">
          {title}
          {highlight && (
            <>
              {" "}
              <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
                {highlight}
              </span>
            </>
          )}
        </span>
        {/* animated underline */}
        <span className="mt-3 block h-[2px] w-20 origin-left bg-gradient-to-r from-accent via-cyan-400/80 to-transparent">
          <span className="block h-full w-full scale-x-0 bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-70 animate-[pulse_2.2s_ease-in-out_infinite]" />
        </span>
      </h2>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
};

export default AnimatedHeading;

