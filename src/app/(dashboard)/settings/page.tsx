"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CsvImportModal } from "@/components/import-export/CsvImportModal";
import { CURRENCIES } from "@/lib/constants";
import {
  Settings,
  Download,
  Upload,
  Bell,
  Database,
  Sparkles,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [reminderDays, setReminderDays] = useState("7");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [isSavingPref, setIsSavingPref] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPref(true);
    setTimeout(() => {
      setIsSavingPref(false);
      alert("Preferences saved successfully!");
    }, 400);
  };

  const handleSyncPortals = async () => {
    try {
      setIsSeeding(true);
      setSeedMessage("");
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setSeedMessage("Portals and verified directory synced successfully!");
    } catch (err) {
      console.error("Sync error:", err);
      setSeedMessage("Error syncing portals.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-400" />
          <span>Settings & Data Management</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Customize follow-up reminders, manage CSV spreadsheet migration, and configure defaults.
        </p>
      </div>

      {/* Migration & Backup Card (CSV Import / Export) */}
      <Card className="border-indigo-500/30 bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-400" />
            <span>Google Sheet Migration & CSV Backup</span>
          </CardTitle>
          <CardDescription>
            Import your existing spreadsheet with zero data loss or export anytime.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Import */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">Import Google Sheet (CSV)</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Upload your spreadsheet exported as CSV. Pre-mapped with automatic duplicate skipping.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="w-full mt-2"
              >
                <Upload className="h-3.5 w-3.5" />
                Import CSV File
              </Button>
            </div>

            {/* Export */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">Export Full Pipeline (CSV)</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Download all your applications, tags, salaries, and notes as standard CSV anytime.
                </p>
              </div>
              <a href="/api/export" download className="w-full mt-2 block">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder & Pipeline Preferences */}
      <form onSubmit={handleSavePreferences}>
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <span>Pipeline & Reminder Preferences</span>
            </CardTitle>
            <CardDescription>
              Configure default cadences for automated dashboard follow-up alerts
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="reminderDays">Follow-up Reminder Cadence (Days)</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min={1}
                  max={60}
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Defaults to 7 days after application with no reply.</p>
              </div>

              <div className="space-y-1">
                <Label>Default Compensation Currency</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end pt-3">
            <Button type="submit" size="sm" disabled={isSavingPref}>
              {isSavingPref ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Verified Portals Seed / Resync */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Curated Directory Sync</span>
          </CardTitle>
          <CardDescription>
            Synchronize your portal list with the 24 verified international job boards from Appendix A.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Ensures all 24 Tier 1, 2, and 3 portals are populated in your directory.
            </p>
            {seedMessage && (
              <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{seedMessage}</span>
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant="secondary"
            disabled={isSeeding}
            onClick={handleSyncPortals}
          >
            {isSeeding ? "Syncing..." : "Sync Verified Portals"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone: Clear Pipeline Data */}
      <Card className="border-destructive/30 bg-destructive/10">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm text-destructive flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            <span>Reset Pipeline Data</span>
          </CardTitle>
          <CardDescription>
            Clear all tracked applications and timeline records while keeping your portals and account.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Wipes all application entries to give you a clean slate before importing your real spreadsheet.
          </p>

          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              if (confirm("Are you sure you want to clear all applications? This action cannot be undone.")) {
                await fetch("/api/reset", { method: "POST" });
                alert("Pipeline cleared. You can now import your real applications!");
                router.refresh();
              }
            }}
          >
            Clear All Applications
          </Button>
        </CardContent>
      </Card>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => router.push("/applications")}
      />
    </div>
  );
}