"use client";

import React, { useState, useEffect } from "react";
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{portal ? "Edit Job Portal" : "Add Custom Job Portal"}</DialogTitle>
          <DialogDescription>
            Track new job boards, community listings, and monitor their response rates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Portal Name</Label>
            <Input
              placeholder="e.g. Wellfound, Otta"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Website URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Check Frequency / Tier</Label>
            <Select value={String(tier)} onValueChange={(v) => setTier(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tier 1 — Check Daily (High volume / premium)</SelectItem>
                <SelectItem value="2">Tier 2 — Weekly Sweep (Curated niche boards)</SelectItem>
                <SelectItem value="3">Tier 3 — Reference / Framework-specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Notes / Best strategies</Label>
            <Textarea
              rows={3}
              placeholder="Specializes in React/Next.js roles, direct founder DMs, post times..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : portal ? "Update Portal" : "Add Portal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}