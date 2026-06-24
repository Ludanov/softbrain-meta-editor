import { NextRequest, NextResponse } from 'next/server';

// Doc Editor API
// Handles PDF document operations: metadata, extraction, and batch processing

interface DocMetadataRequest {
  operation: 'metadata' | 'extract' | 'batch';
  file?: string; // base64 encoded PDF
  files?: string[]; // array of base64 encoded files for batch operations
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  };
  extractImages?: boolean;
  extractText?: boolean;
  batchOperation?: 'merge' | 'split' | 'rotate' | 'compress';
  options?: {
    rotation?: number;
    quality?: number;
  };
}

interface DocResponse {
  success: boolean;
  data?: object;
  error?: string;
}

// Validate base64 PDF format
function isValidPdfBase64(data: string): boolean {
  const pdfRegex = /^data:application\/pdf;base64,/;
  return pdfRegex.test(data);
}

// Process metadata operations
function processMetadata(file: string, metadata?: object) {
  // Extract basic info from base64
  const base64Data = file.split(',')[1];
  const sizeInBytes = (base64Data.length * 3) / 4;
  
  return {
    fileSize: sizeInBytes,
    fileSizeFormatted: `${(sizeInBytes / 1024).toFixed(2)} KB`,
    metadata: metadata || {
      note: 'Client-side PDF library required for full metadata extraction',
      supported: ['title', 'author', 'subject', 'keywords', 'creator', 'producer'],
    },
    message: metadata 
      ? 'Metadata update prepared. Use pdf-lib or similar library to apply changes.'
      : 'Metadata extraction prepared. Use pdf.js or similar library to read metadata.',
  };
}

// Process extraction operations
function processExtraction(file: string, extractImages: boolean = true, extractText: boolean = true) {
  const base64Data = file.split(',')[1];
  const sizeInBytes = (base64Data.length * 3) / 4;
  
  return {
    fileSize: sizeInBytes,
    extractImages,
    extractText,
    message: 'Document extraction prepared.',
    note: 'Client-side PDF processing required. Use pdf.js for text extraction and canvas API for image extraction.',
    libraries: {
      textExtraction: 'pdf.js',
      imageExtraction: 'pdf.js + canvas',
    },
  };
}

// Process batch operations
function processBatchOperation(
  files: string[],
  operation: string,
  options?: { rotation?: number; quality?: number }
) {
  const fileInfos = files.map((file, index) => {
    const base64Data = file.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    return {
      index: index + 1,
      size: sizeInBytes,
      sizeFormatted: `${(sizeInBytes / 1024).toFixed(2)} KB`,
    };
  });

  const totalSize = fileInfos.reduce((sum, f) => sum + f.size, 0);

  return {
    fileCount: files.length,
    files: fileInfos,
    totalSize,
    totalSizeFormatted: `${(totalSize / 1024).toFixed(2)} KB`,
    operation,
    options: options || {},
    message: `Batch ${operation} operation prepared for ${files.length} files.`,
    note: 'Client-side PDF processing required. Use pdf-lib for merge, split, rotate, and compress operations.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DocMetadataRequest = await request.json();

    // Validate operation
    if (!body.operation) {
      return NextResponse.json(
        { success: false, error: 'Operation is required (metadata, extract, or batch)' } as DocResponse,
        { status: 400 }
      );
    }

    switch (body.operation) {
      case 'metadata':
        // Validate file
        if (!body.file) {
          return NextResponse.json(
            { success: false, error: 'File is required for metadata operation' } as DocResponse,
            { status: 400 }
          );
        }

        if (!isValidPdfBase64(body.file)) {
          return NextResponse.json(
            { success: false, error: 'Invalid PDF format. Must be base64 encoded PDF with data URI prefix' } as DocResponse,
            { status: 400 }
          );
        }

        // Check file size (max 50MB)
        const metadataSize = (body.file.split(',')[1].length * 3) / 4;
        if (metadataSize > 50 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'File size exceeds maximum of 50MB' } as DocResponse,
            { status: 400 }
          );
        }

        const metadataResult = processMetadata(body.file, body.metadata);
        return NextResponse.json({
          success: true,
          data: metadataResult,
        } as DocResponse, { status: 200 });

      case 'extract':
        // Validate file
        if (!body.file) {
          return NextResponse.json(
            { success: false, error: 'File is required for extraction' } as DocResponse,
            { status: 400 }
          );
        }

        if (!isValidPdfBase64(body.file)) {
          return NextResponse.json(
            { success: false, error: 'Invalid PDF format. Must be base64 encoded PDF with data URI prefix' } as DocResponse,
            { status: 400 }
          );
        }

        // Check file size
        const extractSize = (body.file.split(',')[1].length * 3) / 4;
        if (extractSize > 50 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'File size exceeds maximum of 50MB' } as DocResponse,
            { status: 400 }
          );
        }

        const extractResult = processExtraction(body.file, body.extractImages, body.extractText);
        return NextResponse.json({
          success: true,
          data: extractResult,
        } as DocResponse, { status: 200 });

      case 'batch':
        // Validate files
        if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Files array is required for batch operations' } as DocResponse,
            { status: 400 }
          );
        }

        if (!body.batchOperation || !['merge', 'split', 'rotate', 'compress'].includes(body.batchOperation)) {
          return NextResponse.json(
            { success: false, error: 'Valid batch operation is required (merge, split, rotate, or compress)' } as DocResponse,
            { status: 400 }
          );
        }

        // Validate all files
        for (let i = 0; i < body.files.length; i++) {
          if (!isValidPdfBase64(body.files[i])) {
            return NextResponse.json(
              { success: false, error: `File ${i + 1} is not a valid base64 encoded PDF` } as DocResponse,
              { status: 400 }
            );
          }
        }

        // Validate options
        if (body.batchOperation === 'rotate') {
          if (!body.options?.rotation || ![90, 180, 270].includes(body.options.rotation)) {
            return NextResponse.json(
              { success: false, error: 'Rotation must be 90, 180, or 270 degrees' } as DocResponse,
              { status: 400 }
            );
          }
        }

        if (body.batchOperation === 'compress') {
          if (body.options?.quality && (body.options.quality < 0.1 || body.options.quality > 1)) {
            return NextResponse.json(
              { success: false, error: 'Quality must be between 0.1 and 1' } as DocResponse,
              { status: 400 }
            );
          }
        }

        const batchResult = processBatchOperation(body.files, body.batchOperation, body.options);
        return NextResponse.json({
          success: true,
          data: batchResult,
        } as DocResponse, { status: 200 });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown operation' } as DocResponse,
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Doc Editor API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' } as DocResponse,
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    name: 'Doc Editor API',
    version: '1.0.0',
    description: 'PDF document operations: metadata, extraction, and batch processing',
    endpoint: '/api/tools/doc-editor',
    method: 'POST',
    operations: {
      metadata: {
        description: 'Read or modify PDF document metadata',
        required: ['operation', 'file'],
        optional: ['metadata'],
        supportedMetadata: ['title', 'author', 'subject', 'keywords', 'creator', 'producer'],
      },
      extract: {
        description: 'Extract text and/or images from a PDF',
        required: ['operation', 'file'],
        optional: ['extractImages', 'extractText'],
        defaults: { extractImages: true, extractText: true },
      },
      batch: {
        description: 'Perform batch operations on PDF files',
        required: ['operation', 'files', 'batchOperation'],
        optional: ['options'],
        batchOperations: ['merge', 'split', 'rotate', 'compress'],
        options: {
          rotate: { rotation: '90 | 180 | 270' },
          compress: { quality: '0.1 - 1.0' },
        },
      },
    },
    limits: {
      maxFileSize: '50MB',
      supportedFormat: 'PDF',
      inputFormat: 'Base64 encoded with data URI prefix (data:application/pdf;base64,...)',
    },
    recommendedLibraries: {
      clientSide: {
        textExtraction: 'pdf.js',
        manipulation: 'pdf-lib',
        forms: 'pdf-lib',
      },
    },
    examples: {
      metadata: {
        operation: 'metadata',
        file: 'data:application/pdf;base64,JVBERi0xLjQK...',
        metadata: {
          title: 'My Document',
          author: 'John Doe',
          subject: 'Example PDF',
        },
      },
      extract: {
        operation: 'extract',
        file: 'data:application/pdf;base64,JVBERi0xLjQK...',
        extractImages: true,
        extractText: true,
      },
      batch: {
        operation: 'batch',
        files: [
          'data:application/pdf;base64,JVBERi0xLjQK...',
          'data:application/pdf;base64,JVBERi0xLjQK...',
        ],
        batchOperation: 'merge',
      },
    },
  });
}