"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResumeModal } from "@/components/resumes/ResumeModal";
import { CardsGridSkeleton } from "@/components/ui/skeleton";
import { ResumeVersionItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Plus,
  Download,
  Edit2,
  Trash2,
  Award,
} from "lucide-react";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<ResumeVersionItem | null>(null);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      if (Array.isArray(data)) {
        setResumes(data);
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDelete = async (id: string, label: string) => {
    if (
      !confirm(
        `Delete resume version "${label}"? Existing applications linked to this resume will retain their history.`
      )
    ) {
      return;
    }

    try {
      await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      fetchResumes();
    } catch (err) {
      console.error("Error deleting resume version:", err);
    }
  };

  // Find best performing resume
  const bestPerforming =
    resumes.length > 0
      ? [...resumes]
          .filter((r) => (r.applicationsCount || 0) > 0)
          .sort((a, b) => (b.callbackRate || 0) - (a.callbackRate || 0))[0]
      : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span>Resume Versions</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your tailored resume PDFs and track which versions produce the highest callback rate.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingResume(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Resume
        </Button>
      </div>

      {/* Best Performing Callout Banner */}
      {bestPerforming && (
        <Card className="border bg-card p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted text-foreground border border-border">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Top Converting Resume
              </span>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {bestPerforming.label}
              </p>
            </div>
          </div>

          <Badge variant="success">
            {bestPerforming.callbackRate}% Callback Rate
          </Badge>
        </Card>
      )}

      {/* Resume Grid */}
      {isLoading ? (
        <CardsGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {resumes.map((resume) => (
            <Card
              key={resume.id}
              className="flex flex-col justify-between p-3.5 border bg-card hover:border-muted-foreground/40 transition-colors group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-foreground border border-border">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-foreground group-hover:underline truncate">
                        {resume.label}
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        Added {formatDate(resume.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingResume(resume);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title="Edit Resume"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id, resume.label)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      title="Delete Resume"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 p-2 rounded bg-background border text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Applied</span>
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {resume.applicationsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Callbacks</span>
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {resume.callbacksCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Rate</span>
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {resume.callbackRate || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer action link */}
              <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[170px]">
                  {resume.url.startsWith("/resumes/") ? "PDF File" : "Google Drive"}
                </span>

                <div className="flex items-center gap-2.5">
                  <a
                    href={`/api/resumes/${resume.id}/download`}
                    download
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline"
                    title={resume.url.startsWith("/resumes/") ? "Download PDF" : "Open source link"}
                  >
                    <span>Download</span>
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Card>
          ))}

          {resumes.length === 0 && !isLoading && (
            <div className="col-span-full flex flex-col items-center justify-center p-10 border border-dashed border-border rounded-lg text-center">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-foreground font-medium">No resumes added yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Click &quot;Add Resume&quot; to upload your PDF variants.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <ResumeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingResume(null);
        }}
        resume={editingResume}
        onSuccess={fetchResumes}
      />
    </div>
  );
}