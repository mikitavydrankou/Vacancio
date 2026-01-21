"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus } from "lucide-react"

interface EditListFieldProps {
    items: string[]
    onChange: (items: string[]) => void
    placeholder?: string
    multiline?: boolean
}

export function EditListField({
    items,
    onChange,
    placeholder = "Add item",
    multiline = false,
}: EditListFieldProps) {
    const [newItem, setNewItem] = useState("")

    const handleAdd = () => {
        if (newItem.trim()) {
            onChange([...items, newItem.trim()])
            setNewItem("")
        }
    }

    const handleRemove = (index: number) => {
        onChange(items.filter((_, i) => i !== index))
    }

    const handleUpdate = (index: number, value: string) => {
        const updated = [...items]
        updated[index] = value
        onChange(updated)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !multiline) {
            e.preventDefault()
            handleAdd()
        }
    }

    return (
        <div className="space-y-3">
            {items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="flex gap-2 items-start">
                            <span className="text-muted-foreground mt-2.5 text-sm">•</span>
                            {multiline ? (
                                <Textarea
                                    value={item}
                                    onChange={(e) => handleUpdate(index, e.target.value)}
                                    className="flex-1 min-h-[60px] text-sm"
                                />
                            ) : (
                                <Input
                                    value={item}
                                    onChange={(e) => handleUpdate(index, e.target.value)}
                                    className="flex-1 h-9 text-sm"
                                />
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(index)}
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex gap-2">
                {multiline ? (
                    <Textarea
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 min-h-[60px] text-sm"
                    />
                ) : (
                    <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 h-9 text-sm"
                    />
                )}
                <Button
                    type="button"
                    onClick={handleAdd}
                    size="icon"
                    className="h-9 w-9"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
