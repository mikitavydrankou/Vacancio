"use client"

import { useEffect, useState } from "react"
import { Settings, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    getOpenRouterStatus,
    setOpenRouterKey,
    testOpenRouterKey,
    type OpenRouterStatus,
} from "@/lib/api/settings"
import { cn } from "@/lib/utils"

type Feedback = { type: "success" | "error" | "info"; message: string } | null

export function SettingsDialog() {
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState<OpenRouterStatus | null>(null)
    const [apiKey, setApiKey] = useState("")
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [feedback, setFeedback] = useState<Feedback>(null)

    useEffect(() => {
        if (!open) return
        setFeedback(null)
        setApiKey("")
        getOpenRouterStatus()
            .then(setStatus)
            .catch(() => setFeedback({ type: "error", message: "Could not load current settings." }))
    }, [open])

    const handleSave = async () => {
        setSaving(true)
        setFeedback(null)
        try {
            const next = await setOpenRouterKey(apiKey)
            setStatus(next)
            setApiKey("")
            setFeedback({
                type: "success",
                message: apiKey.trim() ? "API key saved." : "API key cleared.",
            })
        } catch {
            setFeedback({ type: "error", message: "Failed to save the API key." })
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        setTesting(true)
        setFeedback(null)
        try {
            const result = await testOpenRouterKey(apiKey)
            setFeedback(
                result.valid
                    ? { type: "success", message: "Key is valid and reachable." }
                    : { type: "error", message: result.detail || "Key is not valid." }
            )
        } catch (e) {
            setFeedback({ type: "error", message: e instanceof Error ? e.message : "Test failed." })
        } finally {
            setTesting(false)
        }
    }

    const sourceLabel =
        status?.source === "db"
            ? `Configured · ${status.masked}`
            : status?.source === "env"
                ? `From environment · ${status.masked}`
                : "Not configured"

    const busy = saving || testing

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure the OpenRouter key used to parse job postings with AI.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                        <span className="text-muted-foreground">Status</span>
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 font-medium",
                                status?.configured ? "text-green-500" : "text-amber-500"
                            )}
                        >
                            {status?.configured ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : (
                                <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            {sourceLabel}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="openrouter-key" className="text-xs">
                            OpenRouter API Key
                        </Label>
                        <Input
                            id="openrouter-key"
                            type="password"
                            autoComplete="off"
                            placeholder={status?.configured ? "Enter a new key to replace it" : "sk-or-v1-..."}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={busy}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Stored locally in your database. Leave empty and save to clear it.{" "}
                            <a
                                href="https://openrouter.ai/keys"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 underline hover:text-foreground"
                            >
                                Get a key <ExternalLink className="h-3 w-3" />
                            </a>
                        </p>
                    </div>

                    {feedback && (
                        <p
                            className={cn(
                                "flex items-center gap-1.5 text-xs",
                                feedback.type === "success" && "text-green-500",
                                feedback.type === "error" && "text-red-500",
                                feedback.type === "info" && "text-muted-foreground"
                            )}
                        >
                            {feedback.type === "success" ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : feedback.type === "error" ? (
                                <AlertCircle className="h-3.5 w-3.5" />
                            ) : null}
                            {feedback.message}
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={handleTest}
                        disabled={busy || (!apiKey.trim() && !status?.configured)}
                    >
                        {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Test
                    </Button>
                    <Button onClick={handleSave} disabled={busy}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
