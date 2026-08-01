import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false);

  React.useEffect(() => {
    setIsChecked(checked || false);
  }, [checked]);

  const handleChange = (e) => {
    const newChecked = e.target.checked;
    setIsChecked(newChecked);
    if (onCheckedChange) {
      onCheckedChange(newChecked);
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <input
        type="checkbox"
        ref={ref}
        checked={isChecked}
        onChange={handleChange}
        className={cn(
          "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-input bg-surface-sunken",
          "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isChecked && "border-accent bg-accent",
          className
        )}
        {...props}
      />
      {isChecked && (
        <Check className="pointer-events-none absolute h-3 w-3 text-accent-foreground" strokeWidth={3} />
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox"

export { Checkbox }
