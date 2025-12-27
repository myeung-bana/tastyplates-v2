import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

/**
 * Validate AWS credentials from environment variables
 */
function validateAWSCredentials() {
  const requiredEnvVars = {
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return requiredEnvVars;
}

/**
 * Initialize S3 client
 */
function getS3Client() {
  const credentials = validateAWSCredentials();
  
  return new S3Client({
    region: credentials.S3_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: credentials.S3_ACCESS_KEY_ID!,
      secretAccessKey: credentials.S3_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Generate unique filename for batch upload
 */
function generateBatchFileName(originalName: string, extension: string): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  return `gallery/${timestamp}_${random}.${extension}`;
}

/**
 * Get file extension from mime type or filename
 */
function getFileExtension(mimeType: string, fileName: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  if (mimeToExt[mimeType]) {
    return mimeToExt[mimeType];
  }

  // Fallback to filename extension
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
}

/**
 * POST /api/v1/upload/batch
 * 
 * Upload multiple files (up to 10) without optimization
 * Files are uploaded as-is (no WebP conversion, no resizing)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate AWS credentials
    validateAWSCredentials();

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file count (max 10)
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 files allowed per batch' },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validatedFiles: File[] = [];
    const validationErrors: Array<{ fileName: string; error: string }> = [];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        validationErrors.push({
          fileName: file.name,
          error: `Invalid file type: ${file.type}`,
        });
        return;
      }

      if (file.size > maxSize) {
        validationErrors.push({
          fileName: file.name,
          error: `File size too large: ${file.size} bytes`,
        });
        return;
      }

      validatedFiles.push(file);
    });

    if (validatedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errors: validationErrors,
          message: 'All files failed validation',
        },
        { status: 400 }
      );
    }

    // Upload files concurrently
    const s3Client = getS3Client();
    const bucketName = process.env.S3_BUCKET_NAME!;
    const bucketDomain = process.env.S3_BUCKET_DOMAIN || 
      `${bucketName}.s3.${process.env.S3_REGION || 'ap-northeast-2'}.amazonaws.com`;

    const uploadPromises = validatedFiles.map(async (file) => {
      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate S3 key (path: gallery/timestamp_random.extension)
        const extension = getFileExtension(file.type, file.name);
        const s3Key = generateBatchFileName(file.name, extension);

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          ACL: 'public-read',
          Metadata: {
            originalName: file.name,
            originalSize: String(file.size),
          },
        });

        await s3Client.send(uploadCommand);

        // Construct public URL
        const fileUrl = bucketDomain.startsWith('http') 
          ? `${bucketDomain}/${s3Key}` 
          : `https://${bucketDomain}/${s3Key}`;

        return {
          fileName: file.name,
          fileUrl,
          filePath: s3Key,
        };
      } catch (error: any) {
        return {
          fileName: file.name,
          error: error.message || 'Upload failed',
        };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Separate successful and failed uploads
    const successful = results.filter((r) => 'fileUrl' in r);
    const failed = results.filter((r) => 'error' in r) as Array<{ fileName: string; error: string }>;

    // Combine validation errors with upload errors
    const allErrors = [...validationErrors, ...failed];

    if (successful.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errors: allErrors,
          message: 'All uploads failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: successful,
      errors: allErrors.length > 0 ? allErrors : undefined,
      message: `${successful.length} file(s) uploaded successfully${allErrors.length > 0 ? `, ${allErrors.length} failed` : ''}`,
    });
  } catch (error: any) {
    console.error('Batch upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload files',
      },
      { status: 500 }
    );
  }
}

