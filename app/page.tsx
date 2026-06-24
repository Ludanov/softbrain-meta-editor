"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileText, Layers, File as FileIcon, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import FileDropZone from "@/components/doc-editor/FileDropZone";
import MetadataEditor from "@/components/doc-editor/MetadataEditor";
import BatchProcessor from "@/components/doc-editor/BatchProcessor";
import { extractPdfMetadata, extractGenericMetadata, detectFileType, DocumentMetadata, SupportedFileType } from "@/lib/doc-editor/pdf-utils";

export default function DocEditorPage() {
  const t = useTranslations("tools.docEditor");
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [fileType, setFileType] = useState<SupportedFileType>("other");
  const [loading, setLoading] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setLoading(true);
    try {
      const type = detectFileType(selectedFile);
      setFileType(type);
      let meta: DocumentMetadata;
      if (type === "pdf") {
        meta = await extractPdfMetadata(selectedFile);
      } else {
        meta = extractGenericMetadata(selectedFile);
      }
      setFile(selectedFile);
      setMetadata(meta);
      toast.success(`${selectedFile.name} ${t("loaded")}`);
    } catch (err) {
      toast.error(t("failedToRead"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleReset = useCallback(() => {
    setFile(null);
    setMetadata(null);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 -z-10 bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-300/30 dark:bg-gray-700/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-400/30 dark:bg-gray-600/30 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{t("title")}</h1>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!file}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("reset")}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8 relative z-10">
        {/* Hero Section - only show when no file is loaded */}
        {!file && !loading && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-teal-600 dark:text-teal-400">Edit PDF & Document Metadata</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground">Document </span>
              <span className="bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text text-transparent">Metadata Editor</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              View and edit metadata for PDFs and other documents. 100% private - all processing happens in your browser.
            </p>
          </div>
        )}
        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-1.5">
              <FileIcon className="h-4 w-4" />
              {t("singleFile")}
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {t("batch")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">{t("reading")}</p>
              </div>
            ) : file && metadata ? (
              <MetadataEditor metadata={metadata} file={file} fileType={fileType} onReset={handleReset} />
            ) : (
              <FileDropZone onFileSelect={handleFileSelect} />
            )}
          </TabsContent>

          <TabsContent value="batch">
            <BatchProcessor />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
