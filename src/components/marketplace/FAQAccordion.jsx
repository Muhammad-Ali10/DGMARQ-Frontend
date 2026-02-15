import { useState } from "react";
import GlowCard from "./GlowCard";

/**
 * FAQ Accordion - supports items as {q, a} or {question, answer}
 * For string-only items, shows generic support message when expanded
 */
export default function FAQAccordion({ items, className = "" }) {
  const [openIndex, setOpenIndex] = useState(null);

  const normalizeItem = (item) => {
    if (typeof item === "string") return { question: item, answer: "For more information, please contact our support team." };
    return {
      question: item.q || item.question,
      answer: item.a || item.answer || "For more information, please contact our support team.",
    };
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, i) => {
        const { question, answer } = normalizeItem(item);
        const isOpen = openIndex === i;

        return (
          <GlowCard key={i} interactive={false} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-sm font-semibold text-white pr-4">{question}</span>
              <span
                className={`shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 pt-0 sm:px-6 sm:pb-5 sm:pt-0 border-t border-white/10">
                  <p className="text-sm text-gray-400 leading-relaxed pt-4">{answer}</p>
                </div>
              </div>
            </div>
          </GlowCard>
        );
      })}
    </div>
  );
}
