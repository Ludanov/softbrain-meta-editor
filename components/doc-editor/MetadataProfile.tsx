import { DocumentMetadata } from "@/lib/doc-editor/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useRef } from "react";

interface MetadataProfileProps {
  currentMetadata: DocumentMetadata;
  onApplyProfile: (profile: Partial<DocumentMetadata>) => void;
}

const exportableKeys: (keyof DocumentMetadata)[] = [
  "title", "author", "subject", "keywords", "creator", "producer",
];

const MetadataProfile = ({ currentMetadata, onApplyProfile }: MetadataProfileProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const profile: Record<string, string> = {};
    for (const key of exportableKeys) {
      const val = currentMetadata[key];
      if (val !== undefined && val !== "") {
        profile[key] = String(val);
      }
    }
    const json = JSON.stringify(profile, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metadata-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Metadata profile exported");
  }, [currentMetadata]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const profile = JSON.parse(ev.target?.result as string);
          if (typeof profile !== "object" || Array.isArray(profile)) {
            throw new Error("Invalid format");
          }
          const validProfile: Partial<DocumentMetadata> = {};
          for (const key of exportableKeys) {
            if (key in profile && typeof profile[key] === "string") {
              (validProfile as any)[key] = profile[key];
            }
          }
          onApplyProfile(validProfile);
          toast.success("Metadata profile applied");
        } catch {
          toast.error("Invalid JSON profile file");
        }
      };
      reader.readAsText(file);
      // reset so same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onApplyProfile]
  );

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-1.5 h-4 w-4" />
        Export profile
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        Import profile
      </Button>
      <label className="sr-only" htmlFor="profile-import">
        Import metadata profile
      </label>
      <input
        id="profile-import"
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
        aria-label="Import metadata profile from JSON file"
      />
    </div>
  );
};

export default MetadataProfile;
