import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/tools/doc-editor/metadata:
 *   post:
 *     summary: Extract document metadata
 *     description: Extract metadata from PDF and other document files
 *     tags: [DocMeta Editor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 description: Base64 encoded file with data URI prefix
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *     responses:
 *       200:
 *         description: Metadata extracted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, fileName } = body;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File data is required" },
        { status: 400 }
      );
    }

    // Validate data URI format
    if (!file.startsWith("data:")) {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Must be base64 encoded with data URI prefix" },
        { status: 400 }
      );
    }

    // Check file size (max 750MB)
    const base64Data = file.split(",")[1];
    const sizeInBytes = base64Data ? (base64Data.length * 3) / 4 : 0;
    const maxSize = 750 * 1024 * 1024; // 750MB
    
    if (sizeInBytes > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File size exceeds maximum of 750MB (current: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB)` 
        },
        { status: 400 }
      );
    }

    // Detect file type from fileName
    const ext = fileName?.split(".").pop()?.toLowerCase() ?? "";
    const isPdf = ext === "pdf";

    if (!isPdf) {
      // Return generic metadata for non-PDF files
      return NextResponse.json({
        success: true,
        metadata: {
          title: fileName?.replace(/\.[^.]+$/, "") ?? "Unknown",
          author: "",
          subject: "",
          keywords: "",
          creator: "",
          producer: "",
          creationDate: new Date().toISOString().slice(0, 16),
          modificationDate: new Date().toISOString().slice(0, 16),
          pageCount: 0,
          fileSize: Math.round(sizeInBytes),
          fileName: fileName ?? "unknown",
          fileType: ext,
        },
      });
    }

    // For PDF, we need to dynamically import pdf-lib
    const { PDFDocument } = await import("pdf-lib");
    
    // Convert base64 to ArrayBuffer
    const arrayBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)).buffer;
    
    const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
    
    const creationDate = pdfDoc.getCreationDate();
    const modDate = pdfDoc.getModificationDate();

    const metadata = {
      title: pdfDoc.getTitle() ?? "",
      author: pdfDoc.getAuthor() ?? "",
      subject: pdfDoc.getSubject() ?? "",
      keywords: pdfDoc.getKeywords() ?? "",
      creator: pdfDoc.getCreator() ?? "",
      producer: pdfDoc.getProducer() ?? "",
      creationDate: creationDate?.toISOString().slice(0, 16) ?? "",
      modificationDate: modDate?.toISOString().slice(0, 16) ?? "",
      pageCount: pdfDoc.getPageCount(),
      fileSize: Math.round(sizeInBytes),
      fileName: fileName ?? "document.pdf",
      fileType: "pdf",
    };

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error("Metadata extraction error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extract metadata from document" },
      { status: 500 }
    );
  }
}