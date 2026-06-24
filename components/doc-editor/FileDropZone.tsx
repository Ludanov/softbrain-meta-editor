import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
}

const FileDropZone = ({ onFileSelect }: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) onFileSelect(files[0]);
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) onFileSelect(files[0]);
    },
    [onFileSelect]
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-200 cursor-pointer ${
        isDragging
          ? "border-drop-zone bg-drop-zone-bg scale-[1.01]"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
      }`}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <label className="sr-only" htmlFor="file-input">
        Select file to upload
      </label>
      <input
        id="file-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.svg,.txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.rtf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        onChange={handleFileInput}
        className="hidden"
        aria-label="Select file to upload for document editing"
      />
      <div className={`rounded-full p-4 transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
        {isDragging ? (
          <FileText className="h-8 w-8 text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">
          {isDragging ? "Drop your file here" : "Drop a file here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, images, text files & more • Edit all metadata properties
        </p>
      </div>
    </div>
  );
};

export default FileDropZone;
