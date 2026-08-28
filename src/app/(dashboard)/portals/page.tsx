"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PortalModal } from "@/components/portals/PortalModal";
import { CardsGridSkeleton } from "@/components/ui/skeleton";
import { PORTAL_TIER_CONFIG } from "@/lib/constants";
import { PortalItem } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import {
  Globe2,
  Plus,
  ExternalLink,
  Clock,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";

export default function PortalsPage() {
  const [portals, setPortals] = useState<PortalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortal, setEditingPortal] = useState<PortalItem | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchPortals = async () => {
    try {
      const res = await fetch("/api/portals");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPortals(data);
      }
    } catch (err) {
      console.error("Error fetching portals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  const handleMarkChecked = async (portalId: string) => {
    try {
      await fetch(`/api/portals/${portalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markChecked: true }),
      });
      fetchPortals();
    } catch (err) {
      console.error("Error marking portal checked:", err);
    }
  };

  const handleDelete = async (portalId: string, name: string) => {
    if (!confirm(`Delete "${name}" from portal directory?`)) return;
    try {
      await fetch(`/api/portals/${portalId}`, { method: "DELETE" });
      fetchPortals();
    } catch (err) {
      console.error("Error deleting portal:", err);
    }
  };

  const filteredPortals = portals.filter((p) => {
    if (selectedTier !== "ALL" && p.tier !== selectedTier) return false;
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.notes?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const tierTabs: { key: number | "ALL"; label: string }[] = [
    { key: "ALL", label: `All (${portals.length})` },
    { key: 1, label: `Tier 1 — Daily (${portals.filter((p) => p.tier === 1).length})` },
    { key: 2, label: `Tier 2 — Weekly (${portals.filter((p) => p.tier === 2).length})` },
    { key: 3, label: `Tier 3 — Reference (${portals.filter((p) => p.tier === 3).length})` },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-muted-foreground" />
            <span>Job Portal Directory</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            24 verified international job boards with response rate metrics and visit tracking.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingPortal(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Portal
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 rounded-lg bg-card border">
        {/* Tier switcher tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {tierTabs.map((tab) => (
            <button
              key={String(tab.key)}
              onClick={() => setSelectedTier(tab.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                selectedTier === tab.key
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search portals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
      </div>

      {/* Portals Grid */}
      {isLoading ? (
        <CardsGridSkeleton cards={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPortals.map((portal) => {
            return (
              <Card
                key={portal.id}
                className="flex flex-col justify-between p-3.5 border bg-card hover:border-muted-foreground/40 transition-colors group"
              >
                <div>
                  {/* Header: Name + Tier Badge + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-xs text-foreground group-hover:underline">
                        {portal.name}
                      </h3>
                      <span className="inline-block px-1.5 py-0 text-[10px] font-mono rounded bg-muted text-muted-foreground mt-1 border border-border">
                        Tier {portal.tier || 3}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPortal(portal);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Edit Portal"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(portal.id, portal.name)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        title="Delete Portal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {portal.notes && (
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {portal.notes}
                    </p>
                  )}

                  {/* Performance stats */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 p-2 rounded bg-background border text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Applied</span>
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {portal.applicationsCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Responses</span>
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {portal.responsesCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Rate</span>
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {portal.responseRate || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Last Checked Timestamp + Direct Visit Link */}
                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {portal.lastCheckedAt
                        ? formatRelativeDate(portal.lastCheckedAt)
                        : "Never checked"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkChecked(portal.id)}
                      className="text-[10px] h-6 px-2"
                    >
                      Check
                    </Button>

                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-muted hover:bg-accent text-foreground border border-border px-2 py-1 text-[10px] font-medium transition-colors"
                    >
                      <span>Visit</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Portal Add / Edit Modal */}
      <PortalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPortal(null);
        }}
        portal={editingPortal}
        onSuccess={fetchPortals}
      />
    </div>
  );
}