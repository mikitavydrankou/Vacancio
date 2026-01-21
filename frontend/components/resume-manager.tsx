"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { Resume } from "@/lib/types"
import { saveResume, deleteResume, getNextResumeVersion } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResumeManagerProps {
  resumes: Resume[]
  activeResume: Resume | null
  onUpdate: () => void
}

export function ResumeManager({ resumes, activeResume, onUpdate }: ResumeManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [resumeName, setResumeName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = () => {
      const newResume: Resume = {
        id: crypto.randomUUID(),
        name: resumeName || file.name.replace(".pdf", ""),
        version: getNextResumeVersion(),
        uploadedAt: new Date(),
        fileData: reader.result as string,
        fileName: file.name,
      }

      saveResume(newResume)
      setResumeName("")
      setIsUploading(false)
      onUpdate()
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = (id: string) => {
    deleteResume(id)
    onUpdate()
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Resume Versions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload new version */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="resume-name" className="text-sm text-muted-foreground">
              Version Name (optional)
            </Label>
            <Input
              id="resume-name"
              placeholder="e.g. DevOps Focus, Senior Level..."
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full gap-2"
            variant="outline"
          >
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Upload New Version
              </>
            )}
          </Button>
        </div>

        {/* List of versions */}
        <div className="space-y-2 pt-2">
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No resumes uploaded yet</p>
            </div>
          ) : (
            resumes
              .sort((a, b) => b.version - a.version)
              .map((resume) => (
                <div
                  key={resume.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    activeResume?.id === resume.id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-secondary/50 hover:bg-secondary",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">v{resume.version}</span>
                        {activeResume?.id === resume.id && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">Active</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{resume.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(resume.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
