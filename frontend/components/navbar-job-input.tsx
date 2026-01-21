"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Resume, JobApplication } from "@/lib/types"
import { saveApplication } from "@/lib/storage"
import { detectJobSource, parseJobUrl, getSourceLabel, getSourceColor } from "@/lib/job-parser"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Link, Loader2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavbarJobInputProps {
  activeResume: Resume | null
  onAdd: () => void
}

type InputState = "idle" | "parsing" | "success" | "error"

export function NavbarJobInput({ activeResume, onAdd }: NavbarJobInputProps) {
  const [url, setUrl] = useState("")
  const [state, setState] = useState<InputState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const detectedSource = url ? detectJobSource(url) : null

  // Auto-parse when URL is pasted
  useEffect(() => {
    if (!url || !activeResume) return

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce - wait 500ms after user stops typing
    timeoutRef.current = setTimeout(async () => {
      // Check if it's a valid URL
      try {
        new URL(url)
      } catch {
        return
      }

      setState("parsing")
      setErrorMessage("")

      try {
        const parsed = await parseJobUrl(url)

        if (!parsed.company || !parsed.position) {
          throw new Error("Could not parse job details")
        }

        // Create application
        const app: JobApplication = {
          id: crypto.randomUUID(),
          resumeId: activeResume.id,
          resumeVersion: activeResume.version,
          url,
          company: parsed.company,
          position: parsed.position,
          location: parsed.location,
          salary: parsed.salary,
          techStack: parsed.techStack || [],
          responsibilities: parsed.responsibilities || [],
          appliedAt: new Date(),
          status: "applied",
          responded: false,
          interviewScheduled: false,
          offerReceived: false,
          rejected: false,
          source: detectedSource || "other",
        }

        saveApplication(app)
        setState("success")
        onAdd()

        // Reset after success
        setTimeout(() => {
          setUrl("")
          setState("idle")
        }, 1500)
      } catch (error) {
        setState("error")
        setErrorMessage(error instanceof Error ? error.message : "Failed to parse")

        // Reset error state after 3s
        setTimeout(() => {
          setState("idle")
          setErrorMessage("")
        }, 3000)
      }
    }, 500)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [url, activeResume, onAdd, detectedSource])

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text")
    // If pasting a URL, it will trigger the useEffect
    setUrl(pastedText)
  }

  return (
    <div className="flex items-center gap-2 flex-1 max-w-xl">
      <div className="relative flex-1">
        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={activeResume ? "Paste job URL to add application..." : "Upload resume first"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPaste={handlePaste}
          disabled={!activeResume || state === "parsing"}
          className={cn(
            "pl-9 pr-10 bg-secondary/50 border-border h-9",
            state === "success" && "border-green-500/50 bg-green-500/10",
            state === "error" && "border-red-500/50 bg-red-500/10",
          )}
        />
        {/* State indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {state === "parsing" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {state === "success" && <Check className="h-4 w-4 text-green-500" />}
          {state === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
        </div>
      </div>

      {/* Source badge */}
      {detectedSource && state === "idle" && (
        <Badge className={cn("shrink-0", getSourceColor(detectedSource))}>{getSourceLabel(detectedSource)}</Badge>
      )}

      {/* Status messages */}
      {state === "parsing" && <span className="text-xs text-muted-foreground shrink-0">Parsing...</span>}
      {state === "success" && <span className="text-xs text-green-500 shrink-0">Added!</span>}
      {state === "error" && <span className="text-xs text-red-500 shrink-0">{errorMessage}</span>}
    </div>
  )
}
