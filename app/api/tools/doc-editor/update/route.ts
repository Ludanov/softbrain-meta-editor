import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/tools/doc-editor/update:
 *   post:
 *     summary: Update PDF metadata
 *     description: Update metadata in a PDF file and return the modified PDF
 *     tags: [DocMeta Editor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [file, metadata]
 *             properties:
 *               file:
 *                 type: string
 *                 description: Base64 encoded PDF with data URI prefix
 *               metadata:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   author:
 *                     type: string
 *                   subject:
 *                     type: string
 *                   keywords:
 *                     type: string
 *                   creator:
 *                     type: string
 *                   producer:
 *                     type: string
 *                   creationDate:
 *                     type: string
 *                   modificationDate:
 *                     type: string
 *     responses:
 *       200:
 *         description: PDF updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, metadata } = body;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File data is required" },
        { status: 400 }
      );
    }

    if (!metadata) {
      return NextResponse.json(
        { success: false, error: "Metadata is required" },
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

    // Import pdf-lib
    const { PDFDocument } = await import("pdf-lib");
    
    // Convert base64 to ArrayBuffer
    const arrayBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)).buffer;
    
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Update metadata
    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      pdfDoc.setKeywords(
        typeof metadata.keywords === "string" 
          ? metadata.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
          : []
      );
    }
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

    if (metadata.creationDate) {
      try {
        pdfDoc.setCreationDate(new Date(metadata.creationDate));
      } catch {
        // Invalid date format, skip
      }
    }
    if (metadata.modificationDate) {
      try {
        pdfDoc.setModificationDate(new Date(metadata.modificationDate));
      } catch {
        // Invalid date format, skip
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Convert to base64
    const modifiedBase64 = btoa(
      String.fromCharCode(...new Uint8Array(modifiedPdfBytes))
    );

    return NextResponse.json({
      success: true,
      file: `data:application/pdf;base64,${modifiedBase64}`,
      metadata: {
        title: pdfDoc.getTitle() ?? "",
        author: pdfDoc.getAuthor() ?? "",
        subject: pdfDoc.getSubject() ?? "",
        keywords: pdfDoc.getKeywords() ?? "",
        creator: pdfDoc.getCreator() ?? "",
        producer: pdfDoc.getProducer() ?? "",
        creationDate: pdfDoc.getCreationDate()?.toISOString().slice(0, 16) ?? "",
        modificationDate: pdfDoc.getModificationDate()?.toISOString().slice(0, 16) ?? "",
        pageCount: pdfDoc.getPageCount(),
        fileSize: modifiedPdfBytes.length,
      },
    });
  } catch (error) {
    console.error("PDF update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update PDF metadata" },
      { status: 500 }
    );
  }
}