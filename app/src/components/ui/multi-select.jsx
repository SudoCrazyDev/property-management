import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { X, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverContent = PopoverPrimitive.Content

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Normalize options to handle both string arrays and object arrays
  const normalizedOptions = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt }
      }
      return opt
    })
  }, [options])

  // Get label for a value
  const getLabel = (value) => {
    const option = normalizedOptions.find((opt) => opt.value === value)
    return option?.label || value
  }

  const handleToggle = (optionValue) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((item) => item !== optionValue))
    } else {
      onChange([...selected, optionValue])
    }
  }

  const handleRemove = (optionValue, e) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== optionValue))
  }

  return (
    <div className={cn("relative w-full space-y-2", className)}>
      {/* Selected Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            >
              {getLabel(item)}
              <button
                type="button"
                onClick={(e) => handleRemove(item, e)}
                className="ml-1 rounded-full hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Popover with Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between",
              selected.length === 0 && "text-muted-foreground"
            )}
          >
            <span>{selected.length > 0 ? `${selected.length} selected` : placeholder}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-1 bg-white z-[9999]"
          align="start"
          sideOffset={4}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No options available
              </div>
            ) : (
              normalizedOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                      "bg-white",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
