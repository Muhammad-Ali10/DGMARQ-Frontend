import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const SearchableSelect = React.forwardRef(
  (
    {
      options = [],
      value,
      onValueChange,
      placeholder = "Select an option...",
      searchPlaceholder = "Search...",
      emptyMessage = "No options found",
      loading = false,
      disabled = false,
      className,
      label,
      description,
      maxHeight = "300px",
      renderOption,
      getOptionLabel = (option) => option?.name || option?.label || String(option),
      getOptionValue = (option) => option?.id || option?.value || option?._id || String(option),
      filterFunction = (option, searchQuery) => {
        const label = getOptionLabel(option).toLowerCase();
        return label.includes(searchQuery.toLowerCase());
      },
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const containerRef = React.useRef(null);
    const inputRef = React.useRef(null);
    const listRef = React.useRef(null);

    const selectedOption = React.useMemo(
      () => options.find((opt) => getOptionValue(opt) === value),
      [options, value, getOptionValue]
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) {
        return options;
      }
      return options.filter((option) => filterFunction(option, searchQuery));
    }, [options, searchQuery, filterFunction]);

    React.useEffect(() => {
      if (open && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        setFocusedIndex(-1);
      } else {
        setSearchQuery("");
        setFocusedIndex(-1);
      }
    }, [open]);

    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setOpen(false);
        }
      };

      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [open]);

    const handleSelect = (option) => {
      const optionValue = getOptionValue(option);
      onValueChange?.(optionValue);
      setOpen(false);
      setSearchQuery("");
    };

    React.useEffect(() => {
      if (focusedIndex >= 0 && listRef.current) {
        const focusedElement = listRef.current.children[focusedIndex];
        if (focusedElement) {
          focusedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }, [focusedIndex]);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchQuery("");
        setFocusedIndex(-1);
      } else if (e.key === "Enter") {
        if (open && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          e.preventDefault();
          handleSelect(filteredOptions[focusedIndex]);
        } else if (!open) {
          setOpen(true);
        }
      } else if (e.key === "ArrowDown" && open) {
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp" && open) {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    };

    const handleClear = (e) => {
      e.stopPropagation();
      onValueChange?.("");
      setSearchQuery("");
    };

    return (
      <div className={cn("space-y-2", className)} ref={containerRef}>
        {label && (
          <div>
            <Label className="text-white text-base font-semibold">{label}</Label>
            {description && (
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        )}
        <div className="relative" ref={ref}>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            onClick={() => setOpen(!open)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full justify-between bg-secondary border-gray-700 text-white hover:bg-gray-700",
              !selectedOption && "text-gray-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="truncate">
              {selectedOption ? getOptionLabel(selectedOption) : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {selectedOption && !disabled && (
                <X
                  className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                  onClick={handleClear}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>

          {open && (
            <div
              className={cn(
                "absolute z-50 w-full mt-1 bg-secondary border border-gray-700 rounded-md shadow-lg",
                "animate-in fade-in-0 zoom-in-95 min-w-[500px]"
              )}
              style={{ maxHeight }}
            >
              <div className="p-2 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setFocusedIndex(0);
                      } else if (e.key === "Escape") {
                        setOpen(false);
                        setSearchQuery("");
                        setFocusedIndex(-1);
                      }
                    }}
                    className="pl-8 bg-primary border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div
                ref={listRef}
                className={cn(
                  "overflow-x-hidden",
                  filteredOptions.length > 10 && "overflow-y-auto"
                )}
                style={{ 
                  maxHeight: filteredOptions.length > 10 
                    ? `calc(${maxHeight} - 60px)` 
                    : undefined
                }}
                role="listbox"
              >
                {loading ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Loading...
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {emptyMessage}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const optionValue = getOptionValue(option);
                    const isSelected = value === optionValue;
                    const isFocused = index === focusedIndex;
                    const optionLabel = getOptionLabel(option);

                    return (
                      <div
                        key={optionValue}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelect(option);
                          }
                        }}
                        tabIndex={isFocused ? 0 : -1}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none min-h-[3.5rem]",
                          "hover:bg-gray-700 focus:bg-gray-700",
                          isSelected && "bg-accent/20 text-accent",
                          isFocused && "bg-gray-700"
                        )}
                      >
                        {renderOption ? (
                          renderOption(option, isSelected)
                        ) : (
                          <>
                            <span className="flex-1 truncate">{optionLabel}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-accent ml-2 shrink-0" />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {filteredOptions.length > 0 && (
                <div className="p-2 border-t border-gray-700 text-xs text-gray-400 text-center">
                  {filteredOptions.length} of {options.length} products
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect };

