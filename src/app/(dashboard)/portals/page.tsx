"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PortalModal } from "@/components/portals/PortalModal";
import { CardsGridSkeleton } from "@/components/ui/Skeleton";
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-zinc-400" />
            <span>Job Portal Directory</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            24 verified international job boards with response rate metrics and visit tracking.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setEditingPortal(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          Add Portal
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
        {/* Tier switcher tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedTier("ALL")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedTier === "ALL"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({portals.length})
          </button>
          <button
            onClick={() => setSelectedTier(1)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedTier === 1
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tier 1 — Daily ({portals.filter((p) => p.tier === 1).length})
          </button>
          <button
            onClick={() => setSelectedTier(2)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedTier === 2
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tier 2 — Weekly ({portals.filter((p) => p.tier === 2).length})
          </button>
          <button
            onClick={() => setSelectedTier(3)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedTier === 3
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tier 3 — Reference ({portals.filter((p) => p.tier === 3).length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search portals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 pl-8 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
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
              className="flex flex-col justify-between p-3.5 border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors group"
            >
              <div>
                {/* Header: Name + Tier Badge + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-xs text-zinc-100 group-hover:underline">
                      {portal.name}
                    </h3>
                    <span className="inline-block px-1.5 py-0 text-[10px] font-mono rounded bg-zinc-800 text-zinc-400 mt-1 border border-zinc-750">
                      Tier {portal.tier || 3}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPortal(portal);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-300"
                      title="Edit Portal"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(portal.id, portal.name)}
                      className="p-1 text-zinc-500 hover:text-red-400"
                      title="Delete Portal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {portal.notes && (
                  <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {portal.notes}
                  </p>
                )}

                {/* Performance stats */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 p-2 rounded bg-zinc-950 border border-zinc-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Applied</span>
                    <span className="text-xs font-mono font-semibold text-zinc-300">
                      {portal.applicationsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Responses</span>
                    <span className="text-xs font-mono font-semibold text-zinc-300">
                      {portal.responsesCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Rate</span>
                    <span className="text-xs font-mono font-semibold text-zinc-100">
                      {portal.responseRate || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer: Last Checked Timestamp + Direct Visit Link */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2">
                <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-500" />
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
                    className="inline-flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-2 py-1 text-[10px] font-medium transition-colors"
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
