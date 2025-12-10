import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export function EditableHeading({ 
  value, 
  onChange, 
  placeholder = "Enter address...",
  className,
  ...props 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value || "")
  const inputRef = useRef(null)

  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (onChange && localValue !== value) {
      onChange(localValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === "Escape") {
      setLocalValue(value || "")
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full text-3xl font-bold tracking-tight outline-none bg-transparent border-none p-0 m-0",
          className
        )}
        placeholder={placeholder}
        {...props}
      />
    )
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className={cn(
        "text-3xl font-bold tracking-tight cursor-text hover:opacity-80 transition-opacity",
        !value && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {value || placeholder}
    </h1>
  )
}

