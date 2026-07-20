import { Fragment } from "react";
import "./CheckoutSteps.css";

// Multi-step flow progress: Cart → Checkout → Reveal (ported from the v74 mockup
// `.cp-steps`). `current` marks the active step; earlier steps render as "done"
// with a filled connector, later steps as "todo".
const STEPS = [
  { key: "cart", label: "Cart" },
  { key: "checkout", label: "Checkout" },
  { key: "reveal", label: "Reveal" },
];

const CheckoutSteps = ({ current = "checkout" }) => {
  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.key === current));

  return (
    <div className="cp-steps" role="list" aria-label="Checkout progress">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
        return (
          <Fragment key={step.key}>
            <div
              className={`cp-step ${state}`}
              role="listitem"
              aria-current={state === "active" ? "step" : undefined}
            >
              <span className="num">{i + 1}</span>
              <span className="lbl">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`cp-step-line ${i < currentIndex ? "filled" : ""}`} aria-hidden="true" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default CheckoutSteps;
