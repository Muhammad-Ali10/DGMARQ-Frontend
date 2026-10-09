import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const StepProgress = ({ steps, current, onStepClick }) => {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const isCompleted = i < current;
          const isActive = i === current;
          const clickable = isCompleted && typeof onStepClick === 'function';

          return (
            <div key={step.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick(i)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                    isCompleted && 'border-green-500 bg-green-500 text-fg',
                    isActive && 'border-accent bg-accent text-fg shadow-[0_0_0_4px_rgba(14,81,226,0.25)]',
                    !isCompleted && !isActive && 'border-border-interactive bg-transparent text-fg-subtle',
                    clickable && 'cursor-pointer hover:scale-105',
                  )}
                  aria-label={step.label}
                >
                  {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </button>
                <span
                  className={cn(
                    'mt-2 hidden text-xs font-medium sm:block whitespace-nowrap',
                    isActive ? 'text-fg' : isCompleted ? 'text-success' : 'text-fg-subtle',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 rounded-full bg-surface-2 sm:-mt-6">
                  <div
                    className={cn(
                      'h-full rounded-full bg-green-500 transition-all duration-500',
                      i < current ? 'w-full' : 'w-0',
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-sm font-medium text-fg sm:hidden">
        Step {current + 1} of {steps.length}: {steps[current]?.label}
      </p>
    </div>
  );
};

export default StepProgress;
