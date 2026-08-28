"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumeVersionItem } from "@/lib/types";
import { Upload, FileText, CheckCircle2, Link2, Loader2 } from "lucide-react";

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resume) {
      setLabel(resume.label);
      setUrl(resume.url);
      setUploadedFileName(
        resume.url.startsWith("/resumes/") ? resume.url.replace("/resumes/", "") : ""
      );
      setMode(resume.url.startsWith("http") ? "url" : "upload");
    } else {
      setLabel("");
      setUrl("");
      setUploadedFileName("");
      setMode("upload");
    }
  }, [resume, isOpen]);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a valid PDF file.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUrl(data.url);
      setUploadedFileName(data.filename);
      if (!label) {
        setLabel(data.suggestedLabel);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to upload PDF file");
    } finally {
      setIsUploading(false);
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
    if (!label || !url) return;

    try {
      setIsSubmitting(true);
      const payload = { label: label.trim(), url: url.trim() };

      if (resume?.id) {
        await fetch(`/api/resumes/${resume.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Resume submit error:", err);
      alert("Failed to save resume version.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    : url
                    ? "border-emerald-500/50 bg-emerald-950/15"
                    : "border-border hover:border-muted-foreground/40 bg-card"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading PDF...</span>
                  </div>
                ) : url ? (
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
              disabled={!label || !url || isUploading}
            >
              {isSubmitting ? "Saving..." : resume ? "Update Resume" : "Save Resume"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}