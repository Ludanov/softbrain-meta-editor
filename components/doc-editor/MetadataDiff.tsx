import { DocumentMetadata } from "@/lib/doc-editor/pdf-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompareArrows, ArrowRight } from "lucide-react";

interface MetadataDiffProps {
  original: DocumentMetadata;
  edited: DocumentMetadata;
}

const diffFields: { key: keyof DocumentMetadata; label: string }[] = [
  { key: "fileName", label: "File Name" },
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "subject", label: "Subject" },
  { key: "keywords", label: "Keywords" },
  { key: "creator", label: "Creator Application" },
  { key: "producer", label: "PDF Producer" },
  { key: "creationDate", label: "Creation Date" },
  { key: "modificationDate", label: "Modification Date" },
  { key: "pageCount", label: "Page Count" },
  { key: "fileSize", label: "File Size (bytes)" },
];

const MetadataDiff = ({ original, edited }: MetadataDiffProps) => {
  const changedFields = diffFields.filter(
    (f) => String(original[f.key]) !== String(edited[f.key])
  );
  const unchangedFields = diffFields.filter(
    (f) => String(original[f.key]) === String(edited[f.key])
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitCompareArrows className="mr-1.5 h-4 w-4" />
          Diff view
          {changedFields.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
              {changedFields.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            Metadata Changes
          </DialogTitle>
        </DialogHeader>

        {changedFields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No changes detected.
          </p>
        ) : (
          <div className="space-y-3 mt-2">
            {/* Changed fields */}
            {changedFields.map((field) => {
              const origVal = String(original[field.key] ?? "");
              const editVal = String(edited[field.key] ?? "");
              return (
                <div
                  key={field.key}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  <div className="px-3 py-2 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    {field.label}
                    <ArrowRight className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="px-3 py-2.5 bg-red-50 dark:bg-red-950/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
                        Original
                      </span>
                      <p className="text-sm font-mono text-foreground break-all bg-red-100 dark:bg-red-900/50 rounded px-2 py-1">
                        {origVal || <span className="text-muted-foreground italic">empty</span>}
                      </p>
                    </div>
                    <div className="px-3 py-2.5 bg-green-50 dark:bg-green-950/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 block mb-1">
                        Modified
                      </span>
                      <p className="text-sm font-mono text-foreground break-all bg-green-100 dark:bg-green-900/50 rounded px-2 py-1">
                        {editVal || <span className="text-muted-foreground italic">empty</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unchanged summary */}
            {unchangedFields.length > 0 && (
              <p className="text-xs text-muted-foreground pt-2 text-center">
                {unchangedFields.length} field{unchangedFields.length !== 1 ? "s" : ""} unchanged
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MetadataDiff;
