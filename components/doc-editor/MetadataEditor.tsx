import { useState } from "react";
import {
  DocumentMetadata,
  formatFileSize,
  updatePdfMetadata,
  getFileExtension,
  SupportedFileType,
} from "@/lib/doc-editor/pdf-utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MetadataDiff from "@/components/doc-editor/MetadataDiff";
import MetadataProfile from "@/components/doc-editor/MetadataProfile";
import {
  Download,
  FileText,
  RotateCcw,
  Calendar,
  Hash,
  User,
  BookOpen,
  Tag,
  Wrench,
  Cpu,
  Layers,
  HardDrive,
  File,
  Image,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";

interface MetadataEditorProps {
  metadata: DocumentMetadata;
  file: File;
  fileType: SupportedFileType;
  onReset: () => void;
}

interface FieldConfig {
  key: keyof DocumentMetadata;
  label: string;
  icon: React.ReactNode;
  multiline?: boolean;
  inputType?: string;
}

const allFields: FieldConfig[] = [
  { key: "fileName", label: "File Name", icon: <File className="h-4 w-4" /> },
  { key: "title", label: "Title", icon: <BookOpen className="h-4 w-4" /> },
  { key: "author", label: "Author", icon: <User className="h-4 w-4" /> },
  { key: "subject", label: "Subject", icon: <Tag className="h-4 w-4" /> },
  { key: "keywords", label: "Keywords", icon: <Hash className="h-4 w-4" />, multiline: true },
  { key: "creator", label: "Creator Application", icon: <Wrench className="h-4 w-4" /> },
  { key: "producer", label: "PDF Producer", icon: <Cpu className="h-4 w-4" /> },
  { key: "creationDate", label: "Creation Date", icon: <Calendar className="h-4 w-4" />, inputType: "datetime-local" },
  { key: "modificationDate", label: "Modification Date", icon: <Calendar className="h-4 w-4" />, inputType: "datetime-local" },
  { key: "pageCount", label: "Page Count", icon: <Layers className="h-4 w-4" />, inputType: "number" },
  { key: "fileSize", label: "File Size (bytes)", icon: <HardDrive className="h-4 w-4" />, inputType: "number" },
];

const fileTypeIcons: Record<SupportedFileType, React.ReactNode> = {
  pdf: <FileText className="h-6 w-6 text-primary" />,
  image: <Image className="h-6 w-6 text-primary" />,
  text: <FileCode className="h-6 w-6 text-primary" />,
  other: <File className="h-6 w-6 text-primary" />,
};

const MetadataEditor = ({ metadata, file, fileType, onReset }: MetadataEditorProps) => {
  const [editedMetadata, setEditedMetadata] = useState<DocumentMetadata>(metadata);
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify(metadata) !== JSON.stringify(editedMetadata);

  const handleFieldChange = (key: keyof DocumentMetadata, value: string | number) => {
    setEditedMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyProfile = (profile: Partial<DocumentMetadata>) => {
    setEditedMetadata((prev) => ({ ...prev, ...profile }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (fileType === "pdf") {
        const pdfBytes = await updatePdfMetadata(file, editedMetadata);
        const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const outputName = editedMetadata.fileName || file.name;
        a.download = outputName.endsWith(".pdf") ? outputName : `${outputName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PDF saved with updated metadata!");
      } else {
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = editedMetadata.fileName || file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("File downloaded!");
      }
    } catch (err) {
      toast.error("Failed to save. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setEditedMetadata(metadata);
    toast.info("Changes reverted");
  };

  const ext = getFileExtension(file.name);

  return (
    <div className="animate-fade-in space-y-6">
      {/* File header */}
      <div className="flex items-start justify-between gap-4 rounded-xl bg-card border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            {fileTypeIcons[fileType]}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{file.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">{ext}</Badge>
              <span className="text-sm text-muted-foreground">{formatFileSize(metadata.fileSize)}</span>
              {metadata.pageCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  • {metadata.pageCount} page{metadata.pageCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <RotateCcw className="mr-1.5 h-4 w-4" />
          New file
        </Button>
      </div>

      {/* Profile + Diff toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card border border-border px-5 py-3">
        <MetadataProfile currentMetadata={editedMetadata} onApplyProfile={handleApplyProfile} />
        <MetadataDiff original={metadata} edited={editedMetadata} />
      </div>

      {fileType !== "pdf" && (
        <div className="rounded-lg border border-border bg-accent/50 px-4 py-3 text-sm text-muted-foreground">
          <strong>Note:</strong> Full metadata embedding is supported for PDFs. For other files, metadata changes are tracked locally — only the file name applies on download.
        </div>
      )}

      {/* All fields */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            All Properties
          </h3>
        </div>
        <Separator />
        <div className="divide-y divide-border">
          {allFields.map((field) => {
            const origVal = String(metadata[field.key] ?? "");
            const currVal = String(editedMetadata[field.key] ?? "");
            const isChanged = origVal !== currVal;

            return (
              <div key={field.key} className={`flex items-start gap-4 px-5 py-4 transition-colors ${isChanged ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isChanged ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                  {field.icon}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    {field.label}
                    {isChanged && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">modified</span>
                    )}
                  </label>
                  {field.multiline ? (
                    <Textarea
                      value={String(editedMetadata[field.key] ?? "")}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  ) : (
                    <Input
                      type={field.inputType ?? "text"}
                      value={
                        field.inputType === "number"
                          ? Number(editedMetadata[field.key]) || 0
                          : String(editedMetadata[field.key] ?? "")
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          field.key,
                          field.inputType === "number" ? Number(e.target.value) : e.target.value
                        )
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4 shadow-lg">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          ) : (
            "No changes"
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleRevert}>
              Revert
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            {saving ? "Saving..." : "Save & Download"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MetadataEditor;
