"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusHistoryTimeline } from "@/components/applications/StatusHistoryTimeline";
import { DetailPanelSkeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import {
  STATUS_PIPELINE,
  JOB_NATURE_OPTIONS,
  JOB_TYPE_OPTIONS,
  HOW_APPLIED_OPTIONS,
  CURRENCIES,
} from "@/lib/constants";
import { ApplicationItem, PortalItem, ResumeVersionItem } from "@/lib/types";
import {
  formatDate,
  formatRelativeDate,
  formatSalaryRange,
  getStatusConfig,
  isDateOverdue,
} from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Trash2,
  Clock,
  Star,
  FileText,
  AlertCircle,
} from "lucide-react";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  children,
}: {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [application, setApplication] = useState<ApplicationItem | null>(null);
  const [portals, setPortals] = useState<PortalItem[]>([]);
  const [resumes, setResumes] = useState<ResumeVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    dateApplied: "",
    status: "",
    jobNature: "",
    jobType: "",
    companyLocation: "",
    jobLink: "",
    portalId: "",
    howApplied: "",
    resumeVersionId: "",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    priority: 3,
    followUpDate: "",
    comments: "",
    tags: "",
  });

  const fetchApplication = async () => {
    try {
      setIsLoading(true);
      const [appRes, portalsRes, resumesRes] = await Promise.all([
        fetch(`/api/applications/${id}`),
        fetch("/api/portals"),
        fetch("/api/resumes"),
      ]);

      if (!appRes.ok) {
        throw new Error("Application not found");
      }

      const appData = await appRes.json();
      const portalsData = await portalsRes.json();
      const resumesData = await resumesRes.json();

      setApplication(appData);
      if (Array.isArray(portalsData)) setPortals(portalsData);
      if (Array.isArray(resumesData)) setResumes(resumesData);

      // Populate form
      setFormData({
        company: appData.company || "",
        position: appData.position || "",
        dateApplied: appData.dateApplied ? new Date(appData.dateApplied).toISOString().split("T")[0] : "",
        status: appData.status || "APPLIED",
        jobNature: appData.jobNature || "",
        jobType: appData.jobType || "",
        companyLocation: appData.companyLocation || "",
        jobLink: appData.jobLink || "",
        portalId: appData.portalId || "",
        howApplied: appData.howApplied || "",
        resumeVersionId: appData.resumeVersionId || "",
        salaryMin: appData.salaryMin !== null && appData.salaryMin !== undefined ? String(appData.salaryMin) : "",
        salaryMax: appData.salaryMax !== null && appData.salaryMax !== undefined ? String(appData.salaryMax) : "",
        currency: appData.currency || "USD",
        priority: appData.priority || 3,
        followUpDate: appData.followUpDate ? new Date(appData.followUpDate).toISOString().split("T")[0] : "",
        comments: appData.comments || "",
        tags: appData.tags ? appData.tags.map((t: any) => t.tag.name).join(", ") : "",
      });
    } catch (err) {
      console.error("Error loading application:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplication();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
        portalId: formData.portalId || null,
        resumeVersionId: formData.resumeVersionId || null,
        priority: Number(formData.priority),
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update application");

      const updated = await res.json();
      setApplication(updated);
      alert("Application updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete this application for ${application?.company}?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
      router.push("/applications");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete application.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <DetailPanelSkeleton />;
  }

  if (!application) {
    return (
      <div className="text-center py-16 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Application Not Found</h2>
        <p className="text-xs text-muted-foreground">The application may have been removed.</p>
        <Link href="/applications">
          <Button size="sm">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(formData.status);
  const isOverdue = isDateOverdue(formData.followUpDate, formData.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/applications">
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{application.company}</h1>
              <Badge
                variant="outline"
                className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border`}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{application.position}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {application.jobLink && (
            <a href={application.jobLink} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary">
                <ExternalLink className="h-3.5 w-3.5" />
                Job Posting
              </Button>
            </a>
          )}

          <Button
            size="sm"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>

          <Button
            size="sm"
            disabled={isSaving}
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Detail Form + Status Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Fields Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave}>
            <Card className="space-y-5">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm">Job Application Details</CardTitle>
                <CardDescription>
                  Edit company, role info, linked resume variants, and follow-up milestones
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                {/* Core info */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Company Name">
                    <Input
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </Field>
                  <Field label="Position / Role">
                    <Input
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Date Applied">
                    <DatePicker
                      date={formData.dateApplied ? parseISO(formData.dateApplied) : undefined}
                      onSelect={(d) =>
                        setFormData({
                          ...formData,
                          dateApplied: d ? format(d, "yyyy-MM-dd") : "",
                        })
                      }
                    />
                  </Field>
                  <SelectField
                    label="Pipeline Status"
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                    options={STATUS_PIPELINE.map((s) => ({ value: s.id, label: s.label }))}
                  />
                </div>

                {/* Job characteristics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <SelectField
                    label="Job Nature"
                    value={formData.jobNature}
                    onValueChange={(v) => setFormData({ ...formData, jobNature: v })}
                    options={JOB_NATURE_OPTIONS.map((j) => ({ value: j.id, label: j.label }))}
                  />
                  <SelectField
                    label="Workplace Type"
                    value={formData.jobType}
                    onValueChange={(v) => setFormData({ ...formData, jobType: v })}
                    options={JOB_TYPE_OPTIONS.map((t) => ({ value: t.id, label: t.label }))}
                  />
                  <Field label="Location">
                    <Input
                      placeholder="e.g. Remote — US, Berlin"
                      value={formData.companyLocation}
                      onChange={(e) => setFormData({ ...formData, companyLocation: e.target.value })}
                    />
                  </Field>
                </div>

                {/* Portal & How applied */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Source / Portal"
                    value={formData.portalId || "none"}
                    onValueChange={(v) => setFormData({ ...formData, portalId: v === "none" ? "" : v })}
                  >
                    <SelectItem value="none">-- Direct / No Portal --</SelectItem>
                    {portals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.tier ? `(Tier ${p.tier})` : ""}
                      </SelectItem>
                    ))}
                  </SelectField>
                  <SelectField
                    label="How Applied"
                    value={formData.howApplied}
                    onValueChange={(v) => setFormData({ ...formData, howApplied: v })}
                    options={HOW_APPLIED_OPTIONS.map((h) => ({ value: h, label: h }))}
                  />
                </div>

                {/* Resume Version & Link */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <SelectField
                      label="Linked Resume Version"
                      value={formData.resumeVersionId || "none"}
                      onValueChange={(v) => setFormData({ ...formData, resumeVersionId: v === "none" ? "" : v })}
                    >
                      <SelectItem value="none">-- Select Resume Variant --</SelectItem>
                      {resumes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectField>
                    {application.resumeVersion?.url && (
                      <a
                        href={`/api/resumes/${application.resumeVersion.id}/download`}
                        download
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Download Linked Resume</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  <Field label="Job Posting URL">
                    <Input
                      type="url"
                      value={formData.jobLink}
                      onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })}
                    />
                  </Field>
                </div>

                {/* Salary & Priority */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <Field label="Min Salary">
                    <Input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    />
                  </Field>
                  <Field label="Max Salary">
                    <Input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    />
                  </Field>
                  <SelectField
                    label="Currency"
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                    options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                  />
                  <div className="space-y-1.5">
                    <Label>Priority Rating</Label>
                    <div className="flex items-center gap-1 h-10 px-2 rounded-xl bg-background border border-border">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: star })}
                          className="p-0.5 text-muted-foreground hover:text-amber-400"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= formData.priority
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/50"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Follow-up reminder & Tags */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Field label="Next Follow-up Reminder Date">
                      <DatePicker
                        date={formData.followUpDate ? parseISO(formData.followUpDate) : undefined}
                        onSelect={(d) =>
                          setFormData({
                            ...formData,
                            followUpDate: d ? format(d, "yyyy-MM-dd") : "",
                          })
                        }
                      />
                    </Field>
                    {isOverdue && (
                      <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>This follow-up is overdue!</span>
                      </p>
                    )}
                  </div>
                  <Field label="Tags (comma-separated)">
                    <Input
                      placeholder="dream-company, high-salary"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </Field>
                </div>

                {/* Notes & Comments */}
                <div className="space-y-1.5">
                  <Label>
                    Interview Notes / Recruiter Contacts / Freeform Comments
                  </Label>
                  <Textarea
                    rows={4}
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Take notes on recruiter conversations, tech stack questions, compensation negotiations..."
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Status History Timeline Column (1 Col) */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Status History Timeline</span>
              </CardTitle>
              <CardDescription>
                Chronological log of every pipeline transition with exact timestamps
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <StatusHistoryTimeline history={application.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}