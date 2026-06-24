import { useState, useCallback, useRef } from "react";
import {
  extractPdfMetadata,
  extractGenericMetadata,
  detectFileType,
  updatePdfMetadata,
  DocumentMetadata,
  SupportedFileType,
  formatFileSize,
  getFileExtension,
} from "@/lib/doc-editor/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

interface BatchFile {
  id: string;
  file: File;
  fileType: SupportedFileType;
  originalMetadata: DocumentMetadata;
  editedMetadata: DocumentMetadata;
  status: "ready" | "processing" | "done" | "error";
}

const batchEditableKeys: (keyof DocumentMetadata)[] = [
  "author",
  "subject",
  "keywords",
  "creator",
  "producer",
];

const BatchProcessor = () => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileFields, setProfileFields] = useState<Record<string, string>>({
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(async (fileList: FileList) => {
    setLoading(true);
    const newFiles: BatchFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const type = detectFileType(f);
      let meta: DocumentMetadata;
      try {
        if (type === "pdf") {
          meta = await extractPdfMetadata(f);
        } else {
          meta = extractGenericMetadata(f);
        }
      } catch {
        meta = extractGenericMetadata(f);
      }
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file: f,
        fileType: type,
        originalMetadata: meta,
        editedMetadata: { ...meta },
        status: "ready",
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file${newFiles.length !== 1 ? "s" : ""} added`);
    setLoading(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const applyProfileToAll = () => {
    const fieldsToApply: Partial<DocumentMetadata> = {};
    for (const [key, val] of Object.entries(profileFields)) {
      if (val.trim()) {
        (fieldsToApply as any)[key] = val.trim();
      }
    }
    if (Object.keys(fieldsToApply).length === 0) {
      toast.error("Fill in at least one field to apply");
      return;
    }
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        editedMetadata: { ...f.editedMetadata, ...fieldsToApply },
      }))
    );
    toast.success("Profile applied to all files");
  };

  const handleExportProfile = () => {
    const profile: Record<string, string> = {};
    for (const [key, val] of Object.entries(profileFields)) {
      if (val.trim()) profile[key] = val.trim();
    }
    if (Object.keys(profile).length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Profile exported");
  };

  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== "object" || Array.isArray(data)) throw new Error();
        const newFields = { ...profileFields };
        for (const key of batchEditableKeys) {
          if (key in data && typeof data[key] === "string") {
            newFields[key] = data[key];
          }
        }
        setProfileFields(newFields);
        toast.success("Profile imported");
      } catch {
        toast.error("Invalid profile JSON");
      }
    };
    reader.readAsText(file);
    if (profileInputRef.current) profileInputRef.current.value = "";
  };

  const processAndDownloadAll = async () => {
    setFiles((prev) => prev.map((f) => ({ ...f, status: "processing" })));

    for (const bf of files) {
      try {
        if (bf.fileType === "pdf") {
          const pdfBytes = await updatePdfMetadata(bf.file, bf.editedMetadata);
          const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = bf.editedMetadata.fileName || bf.file.name;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const blob = new Blob([await bf.file.arrayBuffer()], { type: bf.file.type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = bf.editedMetadata.fileName || bf.file.name;
          a.click();
          URL.revokeObjectURL(url);
        }
        setFiles((prev) =>
          prev.map((f) => (f.id === bf.id ? { ...f, status: "done" } : f))
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) => (f.id === bf.id ? { ...f, status: "error" } : f))
        );
      }
      // Small delay between downloads
      await new Promise((r) => setTimeout(r, 300));
    }
    toast.success("Batch processing complete!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Batch Processing</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Add multiple files, set common metadata, then download them all with updated properties.
        </p>
      </div>

      {/* Batch metadata profile */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Metadata Profile (apply to all)
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportProfile}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => profileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import
            </Button>
            <input
              ref={profileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportProfile}
              className="hidden"
            />
          </div>
        </div>
        <Separator />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {batchEditableKeys.map((key) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground capitalize">{key}</label>
              <Input
                value={profileFields[key]}
                onChange={(e) =>
                  setProfileFields((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={`Set ${key}...`}
                className="text-sm"
              />
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <Button onClick={applyProfileToAll} disabled={files.length === 0} size="sm">
            Apply to all files
          </Button>
        </div>
      </div>

      {/* File list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Files ({files.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <UploadCloud className="mr-1.5 h-4 w-4" />
            Add files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.svg,.txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.rtf,.doc,.docx"
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            className="hidden"
          />
        </div>
        <Separator />

        {files.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No files added yet. Click "Add files" to begin.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {files.map((bf) => (
              <div key={bf.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {bf.editedMetadata.fileName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {getFileExtension(bf.file.name)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(bf.file.size)}
                    </span>
                    {bf.editedMetadata.author && (
                      <span className="text-xs text-muted-foreground">
                        by {bf.editedMetadata.author}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bf.status === "done" && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {bf.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                  {bf.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(bf.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batch action */}
      {files.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4 shadow-lg">
          <span className="text-sm text-muted-foreground">
            {files.length} file{files.length !== 1 ? "s" : ""} ready
          </span>
          <Button onClick={processAndDownloadAll} size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Process & Download All
          </Button>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
