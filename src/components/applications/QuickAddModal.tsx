"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log New Application"
      description="Quick-log a job application in under 30 seconds. Required fields are marked."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Core 4 Required Fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Company"
            placeholder="e.g. Vercel, Supabase"
            required
            error={errors.company?.message}
            {...register("company", { required: "Company name is required" })}
          />
          <Input
            label="Position / Role"
            placeholder="e.g. Senior Frontend Engineer"
            required
            error={errors.position?.message}
            {...register("position", { required: "Position is required" })}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Date Applied"
            type="date"
            required
            error={errors.dateApplied?.message}
            {...register("dateApplied", { required: "Date applied is required" })}
          />
          <Select
            label="Initial Pipeline Status"
            required
            {...register("status")}
            options={STATUS_PIPELINE.map((s) => ({ value: s.id, label: s.label }))}
          />
        </div>

        {/* Collapsible More Details Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
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
          <div className="space-y-3.5 pt-3 border-t border-zinc-800 animate-in fade-in-50 duration-200">
            {/* Job Nature & Type */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                label="Job Nature"
                {...register("jobNature")}
                options={JOB_NATURE_OPTIONS.map((j) => ({ value: j.id, label: j.label }))}
              />
              <Select
                label="Workplace Type"
                {...register("jobType")}
                options={JOB_TYPE_OPTIONS.map((j) => ({ value: j.id, label: j.label }))}
              />
              <Input
                label="Location"
                placeholder="e.g. Remote — Global"
                {...register("companyLocation")}
              />
            </div>

            {/* Portal Source & How Applied */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Job Portal / Source"
                {...register("portalId")}
                options={[
                  { value: "", label: "-- Select Source Portal --" },
                  ...portals.map((p) => ({
                    value: p.id,
                    label: `${p.name} ${p.tier ? `(Tier ${p.tier})` : ""}`,
                  })),
                ]}
              />
              <Select
                label="How Applied"
                {...register("howApplied")}
                options={HOW_APPLIED_OPTIONS.map((h) => ({ value: h, label: h }))}
              />
            </div>

            {/* Resume Variant & Job Posting Link */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Resume Variant Sent"
                {...register("resumeVersionId")}
                options={[
                  { value: "", label: "-- Select Resume Version --" },
                  ...resumes.map((r) => ({
                    value: r.id,
                    label: r.label,
                  })),
                ]}
              />
              <Input
                label="Job Posting URL"
                type="url"
                placeholder="https://..."
                {...register("jobLink")}
              />
            </div>

            {/* Compensation & Priority */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Input
                label="Min Salary"
                type="number"
                placeholder="e.g. 100000"
                {...register("salaryMin")}
              />
              <Input
                label="Max Salary"
                type="number"
                placeholder="e.g. 140000"
                {...register("salaryMax")}
              />
              <Select
                label="Currency"
                {...register("currency")}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Priority Rating
                </label>
                <div className="flex items-center gap-1 h-8 px-2 rounded-md bg-zinc-900 border border-zinc-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPriority(star)}
                      className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          star <= priority
                            ? "fill-zinc-300 text-zinc-300"
                            : "text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Follow-up reminder & Tags */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Next Follow-up Reminder Date"
                type="date"
                helperText="Auto-alerts you on the dashboard when due"
                {...register("followUpDate")}
              />
              <Input
                label="Tags (comma-separated)"
                placeholder="e.g. dream-company, cold-apply, react"
                {...register("tags")}
              />
            </div>

            {/* Comments / Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Notes / Interview details
              </label>
              <textarea
                rows={2}
                placeholder="Key requirements, recruiter contacts, or referral details..."
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-zinc-600 focus:outline-none"
                {...register("comments")}
              />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Application
          </Button>
        </div>
      </form>
    </Modal>
  );
}
