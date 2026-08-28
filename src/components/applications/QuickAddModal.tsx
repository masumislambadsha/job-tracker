"use client";

import React, { useState, useEffect } from "react";
import { useForm, useController, Controller, Control } from "react-hook-form";
import { format, parseISO } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  STATUS_PIPELINE,
  JOB_NATURE_OPTIONS,
  JOB_TYPE_OPTIONS,
  HOW_APPLIED_OPTIONS,
  CURRENCIES,
} from "@/lib/constants";
import { ApplicationItem, PortalItem, ResumeVersionItem } from "@/lib/types";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newApp: ApplicationItem) => void;
}

interface FormData {
  company: string;
  position: string;
  dateApplied: string;
  status: string;
  // Optional fields
  jobNature?: string;
  jobType?: string;
  companyLocation?: string;
  jobLink?: string;
  portalId?: string;
  howApplied?: string;
  resumeVersionId?: string;
  salaryMin?: number | string;
  salaryMax?: number | string;
  currency?: string;
  priority?: number;
  followUpDate?: string;
  comments?: string;
  tags?: string;
}

interface SelectFieldProps {
  control: Control<FormData>;
  name: keyof FormData;
  label: string;
  placeholder?: string;
  options: { value: string | number; label: string }[];
}

function SelectField({ control, name, label, placeholder, options }: SelectFieldProps) {
  const { field } = useController({ name, control });
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={String(field.value ?? "")} onValueChange={(v) => field.onChange(v)}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const router = useRouter();
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portals, setPortals] = useState<PortalItem[]>([]);
  const [resumes, setResumes] = useState<ResumeVersionItem[]>([]);
  const [priority, setPriority] = useState<number>(3);

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultFollowUp = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      company: "",
      position: "",
      dateApplied: todayStr,
      status: "APPLIED",
      jobNature: "FULL_TIME",
      jobType: "REMOTE",
      companyLocation: "",
      jobLink: "",
      portalId: "",
      howApplied: "Portal",
      resumeVersionId: "",
      salaryMin: "",
      salaryMax: "",
      currency: "USD",
      followUpDate: defaultFollowUp,
      comments: "",
      tags: "",
    },
  });

  // Fetch portals and resumes for selection
  useEffect(() => {
    if (isOpen) {
      fetch("/api/portals")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPortals(data);
        })
        .catch((err) => console.error("Error fetching portals:", err));

      fetch("/api/resumes")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setResumes(data);
        })
        .catch((err) => console.error("Error fetching resumes:", err));
    }
  }, [isOpen]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        priority,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : null,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : null,
        portalId: data.portalId || null,
        resumeVersionId: data.resumeVersionId || null,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save application");
      }

      const createdApp = await res.json();
      reset();
      setShowMoreDetails(false);
      onClose();

      if (onSuccess) {
        onSuccess(createdApp);
      }
      router.refresh();
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to create application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log New Application</DialogTitle>
          <DialogDescription>
            Quick-log a job application in under 30 seconds. Required fields are marked.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Core 4 Required Fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Company</Label>
              <Input
                placeholder="e.g. Vercel, Supabase"
                {...register("company", { required: "Company name is required" })}
              />
              {errors.company && (
                <p className="text-xs font-medium text-destructive">{errors.company.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Position / Role</Label>
              <Input
                placeholder="e.g. Senior Frontend Engineer"
                {...register("position", { required: "Position is required" })}
              />
              {errors.position && (
                <p className="text-xs font-medium text-destructive">{errors.position.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Controller
                name="dateApplied"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Date Applied</Label>
                    <DatePicker
                      date={field.value ? parseISO(field.value) : undefined}
                      onSelect={(d) =>
                        field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                      }
                    />
                  </div>
                )}
              />
              {errors.dateApplied && (
                <p className="text-xs font-medium text-destructive">{errors.dateApplied.message}</p>
              )}
            </div>
            <SelectField
              control={control}
              name="status"
              label="Initial Pipeline Status"
              options={STATUS_PIPELINE.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>

          {/* Collapsible More Details Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showMoreDetails ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Hide additional details</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>+ Add more details (Source portal, Salary, Resume, Priority, etc.)</span>
                </>
              )}
            </button>
          </div>

          {/* Expandable Section */}
          {showMoreDetails && (
            <div className="space-y-3.5 pt-3 border-t animate-in fade-in-50 duration-200">
              {/* Job Nature & Type */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SelectField
                  control={control}
                  name="jobNature"
                  label="Job Nature"
                  options={JOB_NATURE_OPTIONS.map((j) => ({ value: j.id, label: j.label }))}
                />
                <SelectField
                  control={control}
                  name="jobType"
                  label="Workplace Type"
                  options={JOB_TYPE_OPTIONS.map((j) => ({ value: j.id, label: j.label }))}
                />
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    placeholder="e.g. Remote — Global"
                    {...register("companyLocation")}
                  />
                </div>
              </div>

              {/* Portal Source & How Applied */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  control={control}
                  name="portalId"
                  label="Job Portal / Source"
                  placeholder="-- Select Source Portal --"
                  options={portals.map((p) => ({
                    value: p.id,
                    label: `${p.name} ${p.tier ? `(Tier ${p.tier})` : ""}`,
                  }))}
                />
                <SelectField
                  control={control}
                  name="howApplied"
                  label="How Applied"
                  options={HOW_APPLIED_OPTIONS.map((h) => ({ value: h, label: h }))}
                />
              </div>

              {/* Resume Variant & Job Posting Link */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  control={control}
                  name="resumeVersionId"
                  label="Resume Variant Sent"
                  placeholder="-- Select Resume Version --"
                  options={resumes.map((r) => ({
                    value: r.id,
                    label: r.label,
                  }))}
                />
                <div className="space-y-1">
                  <Label>Job Posting URL</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    {...register("jobLink")}
                  />
                </div>
              </div>

              {/* Compensation & Priority */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label>Min Salary</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100000"
                    {...register("salaryMin")}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max Salary</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 140000"
                    {...register("salaryMax")}
                  />
                </div>
                <SelectField
                  control={control}
                  name="currency"
                  label="Currency"
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
                <div className="space-y-1">
                  <Label>Priority Rating</Label>
                  <div className="flex items-center gap-1 h-9 px-2 rounded-md bg-secondary border">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPriority(star)}
                        className="p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            star <= priority
                              ? "fill-foreground text-foreground"
                              : ""
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Follow-up reminder & Tags */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Next Follow-up Reminder Date</Label>
                  <Controller
                    name="followUpDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value ? parseISO(field.value) : undefined}
                        onSelect={(d) =>
                          field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                        }
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-alerts you on the dashboard when due
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="e.g. dream-company, cold-apply, react"
                    {...register("tags")}
                  />
                </div>
              </div>

              {/* Comments / Notes */}
              <div className="space-y-1">
                <Label>Notes / Interview details</Label>
                <Textarea
                  rows={2}
                  placeholder="Key requirements, recruiter contacts, or referral details..."
                  {...register("comments")}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}