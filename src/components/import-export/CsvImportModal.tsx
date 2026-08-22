"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Upload, CheckCircle2, AlertCircle, FileText, ArrowRight, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [isCommitting, setIsCommitting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importResult, setImportResult] = useState<{ importedCount: number; skippedDuplicates: number } | null>(null);

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setParsedRows([]);
    setDuplicatesCount(0);
    setStep("upload");
    setImportResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseFile(selected);
    }
  };

  const parseFile = (fileObj: File) => {
    setIsParsing(true);
    Papa.parse(fileObj, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        setParsedRows(rows);

        // Run dry-run preview on server to detect duplicates & map columns
        try {
          const res = await fetch("/api/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows, dryRun: true }),
          });
          const data = await res.json();
          setPreviewData(data.preview || []);
          setDuplicatesCount(data.duplicatesCount || 0);
          setStep("preview");
        } catch (err) {
          console.error("Preview error:", err);
          alert("Failed to parse CSV file structure.");
        } finally {
          setIsParsing(false);
        }
      },
      error: (err) => {
        console.error("CSV Parse Error:", err);
        alert("Failed to parse CSV file.");
        setIsParsing(false);
      },
    });
  };

  const handleCommitImport = async () => {
    try {
      setIsCommitting(true);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, dryRun: false }),
      });

      const data = await res.json();
      setImportResult(data);
      setStep("done");
      onSuccess();
    } catch (err) {
      console.error("Import commit error:", err);
      alert("Failed to complete import.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetState();
        onClose();
      }}
      title="Import Google Sheet / CSV"
      description="Upload your existing spreadsheet. Column mapping matching Appendix B is applied automatically."
      maxWidth="2xl"
    >
      {/* STEP 1: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-8 text-center hover:border-indigo-500 hover:bg-slate-900/80 transition-all cursor-pointer group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">
              {file ? file.name : "Click to select or drop CSV file"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Pre-configured for Google Sheet format (Date, Company, Position, Job Status, Resume Drive...)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200 block">Pre-Mapped Columns (Appendix B):</span>
            <p>• Date, Company, Position, Job Status, Job Nature, Job Type, Location, Resume Drive, How Applied, Comments</p>
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Duplicate Detection */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white">
                {parsedRows.length} Rows Found
              </span>
              <p className="text-[11px] text-slate-400">
                Ready to migrate into your JobDesk pipeline
              </p>
            </div>

            {duplicatesCount > 0 ? (
              <Badge variant="warning">
                {duplicatesCount} Duplicates Skipped
              </Badge>
            ) : (
              <Badge variant="success">
                0 Duplicates
              </Badge>
            )}
          </div>

          {/* Preview sample table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
              Sample Mapped Rows Preview (First 5):
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="p-2">Company</th>
                    <th className="p-2">Position</th>
                    <th className="p-2">Date Applied</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {previewData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className={row.isDuplicate ? "opacity-50 line-through" : ""}>
                      <td className="p-2 font-medium text-slate-200">{row.company}</td>
                      <td className="p-2 text-slate-300">{row.position}</td>
                      <td className="p-2 text-slate-400">{formatDate(row.dateApplied)}</td>
                      <td className="p-2 font-semibold text-indigo-400">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={resetState}>
              Upload Different File
            </Button>
            <Button
              variant="primary"
              isLoading={isCommitting}
              onClick={handleCommitImport}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Confirm & Import Rows
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Done */}
      {step === "done" && importResult && (
        <div className="text-center py-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Migration Complete!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Successfully imported{" "}
              <span className="text-emerald-400 font-bold">{importResult.importedCount}</span> applications
              {importResult.skippedDuplicates > 0 &&
                ` (${importResult.skippedDuplicates} duplicates skipped)`}
              .
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              resetState();
              onClose();
            }}
          >
            Go to Applications Table
          </Button>
        </div>
      )}
    </Modal>
  );
}
