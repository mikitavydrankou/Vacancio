"use client"

import { useState, KeyboardEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditTagsFieldProps {
    tags: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    variant?: "default" | "outline"
    className?: string
}

export function EditTagsField({
    tags,
    onChange,
    placeholder = "Add tag and press Enter",
    variant = "default",
    className,
}: EditTagsFieldProps) {
    const [inputValue, setInputValue] = useState("")

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault()
            const newTag = inputValue.trim()
            if (!tags.includes(newTag)) {
                onChange([...tags, newTag])
            }
            setInputValue("")
        }
    }

    const handleRemove = (tagToRemove: string) => {
        onChange(tags.filter((tag) => tag !== tagToRemove))
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Badge
                        key={tag}
                        variant={variant === "outline" ? "outline" : "secondary"}
                        className={cn(
                            "px-2.5 py-1 text-sm font-normal group",
                            variant === "outline" && "border-dashed text-muted-foreground"
                        )}
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => handleRemove(tag)}
                            className="ml-1.5 hover:text-destructive transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-9"
            />
        </div>
    )
}
