"use client"

import { Info, FileUp, ClipboardPaste, BarChart3, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const STEPS = [
    {
        icon: FileUp,
        title: "Add a profile & resume",
        body: "Open “Manage Profiles & Resumes”, create a profile and upload a resume version.",
    },
    {
        icon: ClipboardPaste,
        title: "Paste a job posting",
        body: "Drop in the text or a URL. AI extracts the stack, salary, requirements and seniority.",
    },
    {
        icon: BarChart3,
        title: "Track your conversion",
        body: "Update each application’s status to see how each resume version actually performs.",
    },
]

export function InfoDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="How it works">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>How Vacancio works</DialogTitle>
                    <DialogDescription>
                        A private tracker for your job hunt — everything stays on your machine.
                    </DialogDescription>
                </DialogHeader>

                <ol className="space-y-3 py-2">
                    {STEPS.map((step, i) => (
                        <li key={step.title} className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                                {i + 1}
                            </span>
                            <div className="space-y-0.5">
                                <p className="flex items-center gap-1.5 text-sm font-medium">
                                    <step.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{step.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <p className="flex items-start gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                        AI parsing needs an OpenRouter key — add it once in{" "}
                        <span className="font-medium text-foreground">Settings</span> (gear icon).
                    </span>
                </p>
            </DialogContent>
        </Dialog>
    )
}
