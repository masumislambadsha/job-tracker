"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PortalItem } from "@/lib/types";

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  portal?: PortalItem | null;
  onSuccess: () => void;
}

export function PortalModal({ isOpen, onClose, portal, onSuccess }: PortalModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tier, setTier] = useState<number>(2);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (portal) {
      setName(portal.name);
      setUrl(portal.url);
      setTier(portal.tier || 2);
      setNotes(portal.notes || "");
    } else {
      setName("");
      setUrl("");
      setTier(2);
      setNotes("");
    }
  }, [portal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    try {
      setIsSubmitting(true);
      const payload = { name, url, tier: Number(tier), notes };

      if (portal?.id) {
        await fetch(`/api/portals/${portal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/portals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Portal submit error:", err);
      alert("Failed to save portal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={portal ? "Edit Job Portal" : "Add Custom Job Portal"}
      description="Track new job boards, community listings, and monitor their response rates."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Portal Name"
          placeholder="e.g. Wellfound, Otta"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Website URL"
          type="url"
          placeholder="https://..."
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <Select
          label="Check Frequency / Tier"
          value={tier}
          onChange={(e) => setTier(Number(e.target.value))}
          options={[
            { value: 1, label: "Tier 1 — Check Daily (High volume / premium)" },
            { value: 2, label: "Tier 2 — Weekly Sweep (Curated niche boards)" },
            { value: 3, label: "Tier 3 — Reference / Framework-specific" },
          ]}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Notes / Best strategies</label>
          <textarea
            rows={3}
            placeholder="Specializes in React/Next.js roles, direct founder DMs, post times..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {portal ? "Update Portal" : "Add Portal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
