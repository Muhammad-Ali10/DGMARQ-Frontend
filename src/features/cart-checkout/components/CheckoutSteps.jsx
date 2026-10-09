import { Fragment } from "react";

const STEPS = [
  { key: "cart", label: "Cart" },
  { key: "checkout", label: "Checkout" },
  { key: "reveal", label: "Reveal" },
];

const WRAP =
  "flex items-center gap-0 mb-[26px] p-[14px] min-[621px]:px-[20px] min-[621px]:py-[16px] " +
  "bg-[linear-gradient(160deg,rgba(12,20,48,0.85),rgba(8,13,30,0.8))] " +
  "border border-[rgba(58,116,240,0.22)] rounded-[16px] overflow-x-auto";

const NUM_BASE =
  "flex items-center justify-center shrink-0 [transition:all_0.3s] " +
  "w-[36px] h-[36px] text-[15px] rounded-[10px] " +
  "min-[621px]:w-[42px] min-[621px]:h-[42px] min-[621px]:text-[17px] min-[621px]:rounded-[12px] " +
  "font-extrabold";

const LBL_BASE =
  "text-[14px] min-[621px]:text-[16px] font-extrabold tracking-[0.2px] whitespace-nowrap [transition:color_0.3s]";

const NUM_TONE = {
  active:
    "bg-[linear-gradient(135deg,#0e51e2,#3a74f0)] text-fg " +
    "shadow-[0_4px_16px_rgba(14,81,226,0.55),0_0_0_1px_rgba(120,180,255,0.6),inset_0_1px_0_rgba(255,255,255,0.3)]",
  done: "bg-[rgba(14,81,226,0.18)] border-[1.5px] border-[rgba(58,155,245,0.7)] text-[#3a9bf5]",
  todo: "bg-transparent border-[1.5px] border-[rgba(255,255,255,0.14)] text-[rgba(255,255,255,0.35)]",
};
const LBL_TONE = {
  active: "text-fg",
  done: "text-[rgba(255,255,255,0.85)]",
  todo: "text-[rgba(255,255,255,0.38)]",
};

const LINE_BASE =
  "flex-1 h-[2px] rounded-[2px] relative overflow-hidden bg-[rgba(255,255,255,0.12)] " +
  "min-w-[20px] mx-[10px] min-[621px]:min-w-[36px] min-[621px]:mx-[16px]";

const LINE_FILLED =
  "bg-[linear-gradient(90deg,#0e51e2,#3a9bf5)] shadow-[0_0_10px_rgba(58,155,245,0.5)] " +
  "after:content-[''] after:absolute after:top-0 after:left-[-40%] after:w-[40%] after:h-full " +
  "after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] " +
  "after:animate-cp-flow motion-reduce:after:animate-none";

const CheckoutSteps = ({ current = "checkout" }) => {
  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.key === current));

  return (
    <div className={WRAP} role="list" aria-label="Checkout progress">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
        return (
          <Fragment key={step.key}>
            <div
              className="flex items-center gap-[12px] shrink-0"
              role="listitem"
              aria-current={state === "active" ? "step" : undefined}
            >
              <span className={`${NUM_BASE} ${NUM_TONE[state]}`}>
                {state === "done" ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`${LBL_BASE} ${LBL_TONE[state]}`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`${LINE_BASE} ${i < currentIndex ? LINE_FILLED : ""}`}
                aria-hidden="true"
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default CheckoutSteps;
