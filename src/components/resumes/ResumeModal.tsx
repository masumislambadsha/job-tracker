"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumeVersionItem } from "@/lib/types";
import { Upload, FileText, CheckCircle2, Link2 } from "lucide-react";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume?: ResumeVersionItem | null;
  onSuccess: () => void;
}

export function ResumeModal({ isOpen, onClose, resume, onSuccess }: ResumeModalProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resume) {
      setLabel(resume.label);
      setUrl(resume.url);
      setUploadedFileName(
        resume.fileName || (resume.url.startsWith("/resumes/") ? resume.url.replace("/resumes/", "") : "")
      );
      setPendingFile(null);
      setMode(resume.url.startsWith("http") ? "url" : "upload");
    } else {
      setLabel("");
      setUrl("");
      setUploadedFileName("");
      setPendingFile(null);
      setMode("upload");
    }
  }, [resume, isOpen]);

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a valid PDF file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("PDF must be under 8MB.");
      return;
    }

    // Keep the file client-side and send it together with the label in a
    // single request on Save (avoids a separate upload round-trip and works
    // on Vercel where the filesystem is read-only).
    setPendingFile(file);
    setUploadedFileName(file.name.toLowerCase().replace(/[^a-z0-9_.-]/g, "_"));
    if (!label) {
      const suggested = file.name
        .toLowerCase()
        .replace(/\.pdf$/i, "")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setLabel(suggested);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label) return;
    if (mode === "upload" && !pendingFile && !url) return;
    if (mode === "url" && !url) return;

    try {
      setIsSubmitting(true);

      if (mode === "upload" && pendingFile) {
        // Single-request path: label + PDF together (stored in MongoDB).
        const formData = new FormData();
        formData.append("label", label.trim());
        formData.append("file", pendingFile);

        const endpoint = resume?.id ? `/api/resumes/${resume.id}` : "/api/resumes";
        const method = resume?.id ? "PUT" : "POST";
        const res = await fetch(endpoint, { method, body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to save resume version.");
      } else {
        // URL mode, or editing metadata without replacing the file.
        const payload: Record<string, string> = { label: label.trim(), url: url.trim() };

        if (resume?.id) {
          const res = await fetch(`/api/resumes/${resume.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Failed to save resume version.");
        } else {
          const res = await fetch("/api/resumes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Failed to save resume version.");
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Resume submit error:", err);
      alert(err.message || "Failed to save resume version.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAttachment = Boolean(pendingFile || url);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{resume ? "Edit Resume Version" : "Upload PDF Resume"}</DialogTitle>
          <DialogDescription>
            Upload your PDF resume to track variants and compute callback response rates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle Mode */}
          <div className="flex rounded-md border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded transition-colors ${
                mode === "upload"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload PDF File</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded transition-colors ${
                mode === "url"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Google Drive / URL</span>
            </button>
          </div>

          {/* Upload Mode Area with Drag & Drop */}
          {mode === "upload" ? (
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all cursor-pointer text-center ${
                  isDraggingOver
                    ? "border-primary bg-accent"
                    : hasAttachment
                    ? "border-emerald-500/50 bg-emerald-950/15"
                    : "border-border hover:border-muted-foreground/40 bg-card"
                }`}
              >
                {hasAttachment ? (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    <span className="text-xs font-semibold text-foreground">{uploadedFileName || "PDF Attached"}</span>
                    <span className="text-[11px] text-muted-foreground">Click or drag another file to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Drag & Drop your PDF resume here
                    </span>
                    <span className="text-[11px] text-muted-foreground">or click to browse from your computer</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Google Drive / Web URL</Label>
              <Input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste your public Google Drive or hosted PDF URL.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Resume Label</Label>
            <Input
              placeholder="e.g. Next.js / TypeScript Specialist"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A clear name to select in dropdowns when logging applications.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!label || (mode === "upload" ? !hasAttachment : !url)}
            >
              {isSubmitting ? "Saving..." : resume ? "Update Resume" : "Save Resume"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
