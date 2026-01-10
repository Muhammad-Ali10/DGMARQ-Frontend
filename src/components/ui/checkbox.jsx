import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

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
          "h-4 w-4 shrink-0 rounded-sm border-2 border-gray-400 bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer appearance-none",
          isChecked && "bg-blue-600 border-blue-600",
          className
        )}
        {...props}
      />
      {isChecked && (
        <Check className="absolute h-3 w-3 text-white pointer-events-none" strokeWidth={3} />
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox"

export { Checkbox }
