import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomBytes } from 'crypto';
import { rateLimitOrThrow, uploadRateLimit } from '@/lib/redis-ratelimit';

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
 * Generate unique filename
 */
function generateFileName(originalName: string, extension: string): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  return `${sanitizedName}_${timestamp}_${random}.${extension}`;
}

/**
 * Process image with Sharp (resize, convert to WebP)
 */
async function processImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const isGif = mimeType === 'image/gif';
  
  // Preserve animated GIFs as-is
  if (isGif) {
    return {
      buffer,
      contentType: 'image/gif',
      extension: 'gif',
    };
  }

  // Get max dimensions from environment (default: 1600x1600)
  const maxWidth = parseInt(process.env.IMAGE_MAX_WIDTH || '1600', 10);
  const maxHeight = parseInt(process.env.IMAGE_MAX_HEIGHT || '1600', 10);
  const quality = parseInt(process.env.IMAGE_WEBP_QUALITY || '75', 10);

  // Process image with Sharp
  const processed = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true, // Don't upscale
    })
    .webp({ quality })
    .toBuffer();

  return {
    buffer: processed,
    contentType: 'image/webp',
    extension: 'webp',
  };
}

/**
 * POST /api/v1/upload/image
 * 
 * Upload a single image file with automatic optimization and WebP conversion
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests / 60s per IP (protects cost-intensive uploads)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const rateLimitResult = await rateLimitOrThrow(ip, uploadRateLimit);
    
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      );
    }

    // Validate AWS credentials
    validateAWSCredentials();

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image (resize, convert to WebP)
    const { buffer: processedBuffer, contentType, extension } = await processImage(buffer, file.type);

    // Generate S3 key (path: uploads/YYYY/MM/filename.webp)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileName = generateFileName(file.name, extension);
    const s3Key = `uploads/${year}/${month}/${fileName}`;

    // Upload to S3
    const s3Client = getS3Client();
    const bucketName = process.env.S3_BUCKET_NAME!;

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: processedBuffer,
      ContentType: contentType,
      ACL: 'public-read',
      Metadata: {
        originalName: file.name,
        originalType: file.type,
        originalSize: String(file.size),
      },
    });

    await s3Client.send(uploadCommand);

    // Construct public URL
    const bucketDomain = process.env.S3_BUCKET_DOMAIN || 
      `${bucketName}.s3.${process.env.S3_REGION || 'ap-northeast-2'}.amazonaws.com`;
    
    const fileUrl = bucketDomain.startsWith('http') 
      ? `${bucketDomain}/${s3Key}` 
      : `https://${bucketDomain}/${s3Key}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      filePath: s3Key,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}

