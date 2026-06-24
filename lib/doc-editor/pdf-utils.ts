import { PDFDocument } from "pdf-lib";

export interface DocumentMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
  fileSize: number;
  fileName: string;
}

export type SupportedFileType = "pdf" | "image" | "text" | "other";

export function detectFileType(file: File): SupportedFileType {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "svg", "ico"].includes(ext)) return "image";
  if (["txt", "md", "csv", "json", "xml", "html", "htm", "css", "js", "ts", "tsx", "jsx", "yaml", "yml", "toml", "ini", "cfg", "log", "rtf"].includes(ext)) return "text";
  return "other";
}

export async function extractPdfMetadata(file: File): Promise<DocumentMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

  const creationDate = pdfDoc.getCreationDate();
  const modDate = pdfDoc.getModificationDate();

  return {
    title: pdfDoc.getTitle() ?? "",
    author: pdfDoc.getAuthor() ?? "",
    subject: pdfDoc.getSubject() ?? "",
    keywords: pdfDoc.getKeywords() ?? "",
    creator: pdfDoc.getCreator() ?? "",
    producer: pdfDoc.getProducer() ?? "",
    creationDate: creationDate?.toISOString().slice(0, 16) ?? "",
    modificationDate: modDate?.toISOString().slice(0, 16) ?? "",
    pageCount: pdfDoc.getPageCount(),
    fileSize: file.size,
    fileName: file.name,
  };
}

export function extractGenericMetadata(file: File): DocumentMetadata {
  return {
    title: file.name.replace(/\.[^.]+$/, ""),
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
    creationDate: file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 16) : "",
    modificationDate: file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 16) : "",
    pageCount: 0,
    fileSize: file.size,
    fileName: file.name,
  };
}

export async function updatePdfMetadata(
  file: File,
  metadata: Partial<DocumentMetadata>
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined)
    pdfDoc.setKeywords(metadata.keywords.split(",").map((k) => k.trim()));
  if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
  if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

  if (metadata.creationDate) {
    try {
      pdfDoc.setCreationDate(new Date(metadata.creationDate));
    } catch {}
  }
  if (metadata.modificationDate) {
    try {
      pdfDoc.setModificationDate(new Date(metadata.modificationDate));
    } catch {}
  }

  return pdfDoc.save();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileExtension(name: string): string {
  return (name.split(".").pop() ?? "").toUpperCase();
}
