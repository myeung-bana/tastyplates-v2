# Client-Side S3 Image Upload with Drag & Drop Guide

This guide provides comprehensive documentation for implementing S3 image upload with drag-and-drop functionality in client-side applications. This technique is used for both restaurant listings and restaurant reviews.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Component: ImageUploadDnd](#core-component-imageuploaddnd)
4. [Upload Flow](#upload-flow)
5. [Implementation for Restaurants](#implementation-for-restaurants)
6. [Implementation for Reviews](#implementation-for-reviews)
7. [API Endpoints](#api-endpoints)
8. [Database Storage](#database-storage)
9. [Code Examples](#code-examples)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The client-side S3 image upload system provides:

- **Drag & Drop Interface**: Intuitive file selection and organization
- **Image Preview**: Instant preview using blob URLs before upload
- **Drag to Reorder**: Reorder images using drag-and-drop
- **Featured Image Selection**: Mark any image as featured
- **Automatic Optimization**: Images are automatically converted to WebP and optimized
- **Batch Upload**: Upload multiple images concurrently
- **Blob URL Management**: Automatic cleanup of blob URLs to prevent memory leaks

### Key Features

- ✅ **Real-time Preview**: See images immediately after selection
- ✅ **Drag to Reorder**: Organize images by dragging
- ✅ **Featured Image**: Select featured image with star icon
- ✅ **Automatic WebP Conversion**: Images optimized automatically
- ✅ **Concurrent Uploads**: Multiple images upload in parallel
- ✅ **Error Handling**: Comprehensive error messages
- ✅ **Memory Management**: Automatic blob URL cleanup

---

## Architecture

### System Flow

```
┌─────────────────┐
│  User Drops/    │
│  Selects Files  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ImageUploadDnd  │
│ Component       │
└────────┬────────┘
         │
         ├─► Creates blob URLs for preview
         ├─► Tracks files separately from URLs
         └─► Calls onFilesChange(pendingFiles)
         │
         ▼
┌─────────────────┐
│ Form Submit     │
└────────┬────────┘
         │
         ├─► uploadAllFiles(pendingFiles)
         │   └─► uploadFileToS3(file) for each
         │       └─► POST /api/v1/upload/image
         │
         ▼
┌─────────────────┐
│ S3 Upload API   │
│ /api/v1/upload/ │
│ image           │
└────────┬────────┘
         │
         ├─► Validates file (type, size)
         ├─► Converts to WebP (if applicable)
         ├─► Resizes/optimizes with Sharp
         └─► Uploads to S3: uploads/YYYY/MM/
         │
         ▼
┌─────────────────┐
│ Returns S3 URL  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store in DB     │
│ - uploaded_images│
│   (JSONB array) │
│ - featured_image│
│   _url (string) │
└─────────────────┘
```

### Component Structure

```
ImageUploadDnd (Main Component)
├── Dropzone (react-dropzone)
│   └── File selection/drop
├── DndContext (@dnd-kit/core)
│   └── Drag and drop reordering
├── SortableContext (@dnd-kit/sortable)
│   └── Sortable image items
└── SortableImageItem
    ├── Image preview (blob or S3 URL)
    ├── Drag handle
    ├── Featured star button
    └── Remove button
```

---

## Core Component: ImageUploadDnd

### Location

`src/components/ui/image-upload-dnd.tsx`

### Props Interface

```typescript
interface ImageUploadDndProps {
  images: string[];                    // Array of S3 URLs (existing images)
  onImagesChange: (images: string[]) => void;  // Callback when image URLs change
  onFilesChange?: (files: File[]) => void;     // Callback when files are added/removed
  featuredImageUrl?: string;          // Currently featured image URL
  onFeaturedImageChange?: (url: string | null) => void;  // Callback when featured changes
  maxImages?: number;                  // Maximum number of images (default: 20)
  disabled?: boolean;                  // Disable interactions
}
```

### Internal State

```typescript
interface ImageFile {
  file: File | null;        // null if already uploaded (existing URL)
  previewUrl: string;       // blob URL for preview or existing S3 URL
  isUploaded?: boolean;      // true if already uploaded (is a URL, not a file)
}
```

### Key Behaviors

1. **File Selection**:
   - Uses `react-dropzone` for drag-and-drop and file selection
   - Accepts: JPEG, PNG, WebP, GIF
   - Max size: 10MB per file
   - Creates blob URLs immediately for preview

2. **Image Management**:
   - Tracks files separately from URLs
   - Maintains order for drag-and-drop reordering
   - Syncs blob URLs with S3 URLs after upload

3. **Blob URL Lifecycle**:
   - Creates blob URLs when files are added
   - Replaces blob URLs with S3 URLs after upload
   - Automatically revokes blob URLs on unmount

4. **Featured Image**:
   - Star icon to mark featured image
   - Updates featured image URL when blob → S3 URL conversion happens

---

## Upload Flow

### Step-by-Step Process

#### 1. User Interaction

```typescript
// User drops or selects files
// ImageUploadDnd creates blob URLs
const previewUrl = URL.createObjectURL(file);
// Component calls onFilesChange([file1, file2, ...])
```

#### 2. Form Submission

```typescript
// On form submit, upload pending files
const uploadAllFiles = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadFileToS3(file));
  return Promise.all(uploadPromises);
};

const uploadFileToS3 = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch("/api/v1/upload/image", {
    method: "POST",
    body: formData,
  });
  
  const data = await response.json();
  return data.fileUrl; // Returns S3 URL
};
```

#### 3. S3 Upload API

**Endpoint**: `POST /api/v1/upload/image`

**Process**:
1. Validates file type and size
2. Converts JPEG/PNG to WebP (if applicable)
3. Resizes and optimizes with Sharp
4. Uploads to S3: `uploads/YYYY/MM/{filename}_{timestamp}_{random}.webp`
5. Returns S3 URL

#### 4. Database Storage

**Restaurants**:
- `uploaded_images`: JSONB array of S3 URLs
- `featured_image_url`: String (single S3 URL)

**Reviews**:
- `images`: JSONB array of S3 URLs

---

## Implementation for Restaurants

### Create Restaurant Page

**File**: `src/app/(main)/dashboard/admin/restaurant-listings/create/page.tsx`

```typescript
"use client";

import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { useState } from "react";

export default function CreateRestaurantPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    featured_image_url: "",
    // ... other fields
  });

  // Upload function
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl;
  };

  const uploadAllFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToS3(file));
    return Promise.all(uploadPromises);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload pending files first
    let finalImageUrls = [...uploadedImages];
    if (pendingFiles.length > 0) {
      try {
        const uploadedUrls = await uploadAllFiles(pendingFiles);
        finalImageUrls = [...uploadedImages, ...uploadedUrls];
        setUploadedImages(finalImageUrls);
      } catch (error) {
        toast.error("Failed to upload images");
        return;
      }
    }

    // Filter out blob URLs - only keep S3 URLs
    finalImageUrls = finalImageUrls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      if (url.startsWith('blob:')) return false;
      return url.startsWith('http://') || url.startsWith('https://');
    });

    // Create restaurant with image URLs
    await restaurantV2Service.createRestaurant({
      title: formData.title,
      // ... other fields
      uploaded_images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      featured_image_url: formData.featured_image_url || undefined,
    });
  };

  // Handle featured image change
  const handleFeaturedImageChange = useCallback((url: string | null) => {
    setFormData(prev => ({ ...prev, featured_image_url: url || "" }));
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <ImageUploadDnd
        images={uploadedImages}
        onImagesChange={setUploadedImages}
        onFilesChange={setPendingFiles}
        featuredImageUrl={formData.featured_image_url}
        onFeaturedImageChange={handleFeaturedImageChange}
        maxImages={20}
        disabled={isSubmitting}
      />
      {/* ... rest of form */}
    </form>
  );
}
```

### Edit Restaurant Page

**File**: `src/app/(main)/dashboard/admin/restaurant-listings/edit/[id]/edit-restaurant-client.tsx`

```typescript
"use client";

import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { useState, useEffect } from "react";

export function EditRestaurantClient({ restaurantUuid }: EditRestaurantClientProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    featured_image_url: "",
    // ... other fields
  });

  // Load existing restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      const restaurant = await restaurantV2Service.getRestaurantByUuid(restaurantUuid);
      
      // Set existing images
      const existingImages = restaurant.data.uploaded_images || [];
      const featuredImage = restaurant.data.featured_image_url;
      
      // Include featured image if it exists and isn't already in the array
      if (featuredImage && !existingImages.includes(featuredImage)) {
        setUploadedImages([featuredImage, ...existingImages]);
      } else {
        setUploadedImages(existingImages);
      }
      
      setFormData({
        featured_image_url: featuredImage || "",
        // ... other fields
      });
    };
    
    fetchRestaurant();
  }, [restaurantUuid]);

  // Upload function (same as create)
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl;
  };

  const uploadAllFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToS3(file));
    return Promise.all(uploadPromises);
  };

  // Handle save
  const handleSave = async () => {
    // Upload pending files first
    let finalImageUrls = [...uploadedImages];
    if (pendingFiles.length > 0) {
      try {
        const uploadedUrls = await uploadAllFiles(pendingFiles);
        finalImageUrls = [...uploadedImages, ...uploadedUrls];
        setUploadedImages(finalImageUrls);
      } catch (error) {
        toast.error("Failed to upload images");
        return;
      }
    }

    // Filter out blob URLs
    finalImageUrls = finalImageUrls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      if (url.startsWith('blob:')) return false;
      return url.startsWith('http://') || url.startsWith('https://');
    });

    // Update restaurant
    await restaurantV2Service.updateRestaurant(restaurantId, {
      // ... other fields
      uploaded_images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      featured_image_url: formData.featured_image_url || undefined,
    });
  };

  return (
    <div>
      <ImageUploadDnd
        images={uploadedImages}
        onImagesChange={setUploadedImages}
        onFilesChange={setPendingFiles}
        featuredImageUrl={formData.featured_image_url}
        onFeaturedImageChange={handleFeaturedImageChange}
        maxImages={20}
        disabled={updating}
      />
      {/* ... rest of form */}
    </div>
  );
}
```

---

## Implementation for Reviews

### Create Review Page (Client-Side)

```typescript
"use client";

import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { useState } from "react";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";

export default function CreateReviewPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    content: "",
    title: "",
    rating: 0,
    restaurant_uuid: "",
    // ... other fields
  });

  // Upload function (same as restaurants)
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl;
  };

  const uploadAllFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToS3(file));
    return Promise.all(uploadPromises);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload pending files first
    let finalImageUrls = [...uploadedImages];
    if (pendingFiles.length > 0) {
      try {
        toast.info(`Uploading ${pendingFiles.length} image(s)...`);
        const uploadedUrls = await uploadAllFiles(pendingFiles);
        finalImageUrls = [...uploadedImages, ...uploadedUrls];
        setUploadedImages(finalImageUrls);
        toast.success("All images uploaded successfully!");
      } catch (error) {
        toast.error("Failed to upload images");
        return;
      }
    }

    // Filter out blob URLs - only keep S3 URLs
    finalImageUrls = finalImageUrls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      if (url.startsWith('blob:')) return false;
      return url.startsWith('http://') || url.startsWith('https://');
    });

    // Create review with image URLs
    await reviewV2Service.createReview({
      author_id: currentUser.id,
      restaurant_uuid: formData.restaurant_uuid,
      content: formData.content,
      title: formData.title,
      rating: formData.rating,
      images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      // ... other fields
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Review content fields */}
      
      <div className="space-y-4">
        <h3>Review Images</h3>
        <ImageUploadDnd
          images={uploadedImages}
          onImagesChange={setUploadedImages}
          onFilesChange={setPendingFiles}
          maxImages={10}  // Reviews typically have fewer images
          disabled={isSubmitting}
        />
      </div>

      <button type="submit">Submit Review</button>
    </form>
  );
}
```

### Edit Review Page

```typescript
"use client";

import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { useState, useEffect } from "react";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";

export function EditReviewPage({ reviewId }: { reviewId: number }) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    content: "",
    title: "",
    rating: 0,
    // ... other fields
  });

  // Load existing review data
  useEffect(() => {
    const fetchReview = async () => {
      const review = await reviewV2Service.getReviewById(reviewId);
      
      // Set existing images
      setUploadedImages(review.data.images || []);
      setFormData({
        content: review.data.content,
        title: review.data.title || "",
        rating: review.data.rating,
        // ... other fields
      });
    };
    
    fetchReview();
  }, [reviewId]);

  // Upload function (same as create)
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl;
  };

  const uploadAllFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToS3(file));
    return Promise.all(uploadPromises);
  };

  // Handle save
  const handleSave = async () => {
    // Upload pending files first
    let finalImageUrls = [...uploadedImages];
    if (pendingFiles.length > 0) {
      try {
        const uploadedUrls = await uploadAllFiles(pendingFiles);
        finalImageUrls = [...uploadedImages, ...uploadedUrls];
        setUploadedImages(finalImageUrls);
      } catch (error) {
        toast.error("Failed to upload images");
        return;
      }
    }

    // Filter out blob URLs
    finalImageUrls = finalImageUrls.filter(url => {
      if (!url || typeof url !== 'string') return false;
      if (url.startsWith('blob:')) return false;
      return url.startsWith('http://') || url.startsWith('https://');
    });

    // Update review
    await reviewV2Service.updateReview(reviewId, {
      content: formData.content,
      title: formData.title,
      rating: formData.rating,
      images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      // ... other fields
    });
  };

  return (
    <div>
      <ImageUploadDnd
        images={uploadedImages}
        onImagesChange={setUploadedImages}
        onFilesChange={setPendingFiles}
        maxImages={10}
        disabled={isUpdating}
      />
      {/* ... rest of form */}
    </div>
  );
}
```

---

## API Endpoints

The system provides two API endpoints for uploading images to S3:

1. **`/api/v1/upload/image`** - Single file upload with image optimization
2. **`/api/v1/upload/batch`** - Batch file upload (up to 10 files)

### Environment Variables Configuration

Both endpoints use the following environment variables from `.env`:

```bash
S3_ACCESS_KEY_ID="AKIAUJJYJXEZ5DERETX6"
S3_SECRET_ACCESS_KEY="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"
S3_BUCKET_DOMAIN="https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com"
S3_REGION="ap-northeast-2"
S3_BUCKET_NAME="tastyplates-bucket"
```

**How Environment Variables Are Used**:

- **`S3_ACCESS_KEY_ID`**: AWS access key for S3 authentication
- **`S3_SECRET_ACCESS_KEY`**: AWS secret key for S3 authentication
- **`S3_REGION`**: AWS region where the S3 bucket is located (default: `ap-northeast-2`)
- **`S3_BUCKET_NAME`**: Name of the S3 bucket (e.g., `tastyplates-bucket`)
- **`S3_BUCKET_DOMAIN`**: Full domain URL for the bucket. Can be:
  - Custom domain: `https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com`
  - Or custom CDN domain if configured
  - Used to construct the final public URL for uploaded files

**Optional Environment Variables** (for `/api/v1/upload/image` only):
```bash
IMAGE_MAX_WIDTH=1600      # Maximum image width (default: 1600)
IMAGE_MAX_HEIGHT=1600     # Maximum image height (default: 1600)
IMAGE_WEBP_QUALITY=75     # WebP compression quality 0-100 (default: 75)
```

---

### 1. POST /api/v1/upload/image

**Location**: `src/app/api/v1/upload/image/route.ts`

**Purpose**: Upload a single image file with automatic optimization and WebP conversion.

**Request**:
```typescript
// FormData with single file
const formData = new FormData();
formData.append("file", file);

const response = await fetch("/api/v1/upload/image", {
  method: "POST",
  body: formData,
});
```

**Response (Success)**:
```typescript
{
  success: true,
  fileUrl: "https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/uploads/2024/01/image_1704067200_abc123.webp",
  filePath: "uploads/2024/01/image_1704067200_abc123.webp",
  message: "File uploaded successfully"
}
```

**Response (Error)**:
```typescript
{
  success: false,
  error: "Error message here"
}
```

**Features**:

1. **File Validation**:
   - Allowed types: JPEG, JPG, PNG, WebP, GIF
   - Max size: 10MB per file
   - Validates file type and size before processing

2. **Image Processing** (using Sharp):
   - **Automatic WebP Conversion**: JPEG/PNG/WebP → WebP (GIFs preserved as-is)
   - **Automatic Resize**: Resizes to max 1600x1600px (maintains aspect ratio, no upscaling)
   - **Quality Optimization**: WebP quality set to 75% (configurable)
   - **EXIF Orientation**: Automatically rotates images based on EXIF data
   - **Format Detection**: Preserves animated GIFs without conversion

3. **S3 Storage**:
   - **Path Structure**: `uploads/YYYY/MM/{filename}_{timestamp}_{random}.webp`
     - Example: `uploads/2024/01/restaurant_image_1704067200000_abc123def456.webp`
   - **Public Read Access**: Files are uploaded with `ACL: 'public-read'`
   - **Metadata**: Includes original filename, type, size, processing info

4. **URL Construction**:
   ```typescript
   // Uses S3_BUCKET_DOMAIN from environment
   const fileUrl = `${S3_BUCKET_DOMAIN}/${s3Key}`;
   // Result: https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/uploads/2024/01/...
   ```

**Processing Flow**:
```
File Input
  ↓
Validate (type, size)
  ↓
Convert to Buffer
  ↓
Process with Sharp (if convertible)
  ├─► Resize (max 1600x1600)
  ├─► Rotate (EXIF orientation)
  └─► Convert to WebP (quality: 75)
  ↓
Generate unique filename
  ↓
Upload to S3: uploads/YYYY/MM/filename.webp
  ↓
Return S3 URL
```

**How Environment Variables Are Used in Code**:

```typescript
// In src/app/api/v1/upload/image/route.ts

// 1. Validate credentials
const validateAWSCredentials = () => {
  const requiredEnvVars = {
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,        // From .env
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY, // From .env
    S3_REGION: process.env.S3_REGION,                      // From .env
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,           // From .env
  };
  // ... validation logic
};

// 2. Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-northeast-2',  // Uses S3_REGION
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,          // Uses S3_ACCESS_KEY_ID
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!, // Uses S3_SECRET_ACCESS_KEY
  },
});

// 3. Upload to S3
const uploadCommand = new PutObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME!,  // Uses S3_BUCKET_NAME
  Key: s3Key,                           // e.g., "uploads/2024/01/image.webp"
  Body: outputBody,
  ContentType: contentType,
});

await s3Client.send(uploadCommand);

// 4. Construct public URL
const bucketDomain = process.env.S3_BUCKET_DOMAIN || 
  `${bucketName}.s3.${process.env.S3_REGION || 'ap-northeast-2'}.amazonaws.com`;

const fileUrl = bucketDomain.startsWith('http') 
  ? `${bucketDomain}/${s3Key}` 
  : `https://${bucketDomain}/${s3Key}`;
// Result: https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/uploads/2024/01/image.webp
```

**Example with Actual Values**:

Given these environment variables:
```bash
S3_ACCESS_KEY_ID="AKIAUJJYJXEZ5DERETX6"
S3_SECRET_ACCESS_KEY="OHtzU14YJlxhZ2VFNQyOEelRvuQsn6zjsplw7aTT"
S3_BUCKET_DOMAIN="https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com"
S3_REGION="ap-northeast-2"
S3_BUCKET_NAME="tastyplates-bucket"
```

The upload process:
1. **S3 Client Initialization**:
   ```typescript
   new S3Client({
     region: "ap-northeast-2",  // From S3_REGION
     credentials: {
       accessKeyId: "AKIAUJJYJXEZ5DERETX6",  // From S3_ACCESS_KEY_ID
       secretAccessKey: "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",  // From S3_SECRET_ACCESS_KEY
     },
   });
   ```

2. **Upload Command**:
   ```typescript
   new PutObjectCommand({
     Bucket: "tastyplates-bucket",  // From S3_BUCKET_NAME
     Key: "uploads/2024/01/restaurant_image_1704067200_abc123.webp",
     Body: buffer,
   });
   ```

3. **Final URL Construction**:
   ```typescript
   const fileUrl = "https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/uploads/2024/01/restaurant_image_1704067200_abc123.webp";
   // Constructed from: S3_BUCKET_DOMAIN + "/" + s3Key
   ```

**Example Usage**:
```typescript
const uploadFileToS3 = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/v1/upload/image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  const data = await response.json();
  return data.fileUrl; // Returns full S3 URL
};
```

---

### 2. POST /api/v1/upload/batch

**Location**: `src/app/api/v1/upload/batch/route.ts`

**Purpose**: Upload multiple files (up to 10) in a single request. **Note**: This endpoint does NOT perform image optimization - files are uploaded as-is.

**Request**:
```typescript
// FormData with multiple files
const formData = new FormData();
formData.append("files", file1);
formData.append("files", file2);
formData.append("files", file3);
// ... up to 10 files

const response = await fetch("/api/v1/upload/batch", {
  method: "POST",
  body: formData,
});
```

**Response (Success)**:
```typescript
{
  success: true,
  files: [
    {
      fileName: "original_name.jpg",
      fileUrl: "https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/gallery/1704067200_abc123.jpg",
      filePath: "gallery/1704067200_abc123.jpg"
    },
    {
      fileName: "another_image.png",
      fileUrl: "https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/gallery/1704067201_def456.png",
      filePath: "gallery/1704067201_def456.png"
    }
  ],
  errors: undefined, // or array of errors if some files failed
  message: "2 file(s) uploaded successfully"
}
```

**Response (Partial Success)**:
```typescript
{
  success: true,
  files: [
    { fileName: "image1.jpg", fileUrl: "...", filePath: "..." }
  ],
  errors: [
    { fileName: "image2.jpg", error: "File size too large: 15000000 bytes" }
  ],
  message: "1 file(s) uploaded successfully, 1 failed"
}
```

**Response (All Failed)**:
```typescript
{
  success: false,
  errors: [
    { fileName: "image1.jpg", error: "Invalid file type: application/pdf" }
  ],
  message: "All uploads failed"
}
```

**Features**:

1. **File Validation**:
   - Allowed types: JPEG, JPG, PNG, WebP, GIF
   - Max size: 10MB per file
   - Maximum 10 files per batch request

2. **No Image Processing**:
   - Files are uploaded **as-is** (no WebP conversion, no resizing)
   - Original file format and size are preserved
   - Use this endpoint when you need original files without optimization

3. **S3 Storage**:
   - **Path Structure**: `gallery/{timestamp}-{random}.{extension}`
     - Example: `gallery/1704067200_abc123def456.jpg`
   - **Public Read Access**: Files uploaded with `ACL: 'public-read'`
   - **Original Filename**: Stored in response for reference

4. **Concurrent Uploads**:
   - All files upload concurrently using `Promise.all()`
   - Individual file failures don't stop other uploads
   - Returns both successful and failed uploads

5. **URL Construction**:
   ```typescript
   // Uses S3_BUCKET_DOMAIN from environment
   const bucketDomain = process.env.S3_BUCKET_DOMAIN || 
     `${bucketName}.s3.${process.env.S3_REGION || 'ap-northeast-2'}.amazonaws.com`;
   
   const fileUrl = `https://${bucketDomain}/${fileName}`;
   // Result: https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/gallery/1704067200_abc123.jpg
   ```

**How Environment Variables Are Used in Batch Endpoint**:

```typescript
// In src/app/api/v1/upload/batch/route.ts

// 1. Validate credentials (same as single upload)
const validateAWSCredentials = () => {
  const requiredEnvVars = {
    AWS_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,        // Note: Uses S3_ prefix
    AWS_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.S3_REGION,
    AWS_S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  };
};

// 2. Initialize S3 Client (same as single upload)
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

// 3. Upload each file
const uploadCommand = new PutObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME!,  // "tastyplates-bucket"
  Key: fileName,                        // "gallery/1704067200_abc123.jpg"
  Body: buffer,
  ContentType: file.type,
  ACL: 'public-read',
});

// 4. Construct URL
const bucketDomain = process.env.S3_BUCKET_DOMAIN || 
  `${bucketName}.s3.${process.env.S3_REGION || 'ap-northeast-2'}.amazonaws.com`;

const fileUrl = `https://${bucketDomain}/${fileName}`;
// Result: https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/gallery/1704067200_abc123.jpg
```

**Example Usage**:
```typescript
const uploadBatchFiles = async (files: File[]): Promise<string[]> => {
  if (files.length > 10) {
    throw new Error("Maximum 10 files allowed per batch");
  }

  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });

  const response = await fetch("/api/v1/upload/batch", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Batch upload failed");
  }

  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    console.warn("Some files failed to upload:", data.errors);
  }

  // Return only successful upload URLs
  return data.files?.map((f: { fileUrl: string }) => f.fileUrl) || [];
};
```

---

### Comparison: Single vs Batch Upload

| Feature | `/api/v1/upload/image` | `/api/v1/upload/batch` |
|---------|------------------------|------------------------|
| **Files per request** | 1 | Up to 10 |
| **Image Optimization** | ✅ Yes (WebP, resize) | ❌ No (original files) |
| **File Path** | `uploads/YYYY/MM/` | `gallery/` |
| **Processing** | Sharp (resize, convert) | None (direct upload) |
| **Use Case** | Restaurant/Review images | Gallery, documents, original files |
| **Error Handling** | Single error response | Partial success with error array |
| **Performance** | Slower (processing) | Faster (no processing) |

### When to Use Which Endpoint

**Use `/api/v1/upload/image` when**:
- ✅ You need optimized images (WebP conversion, resizing)
- ✅ Uploading restaurant or review images
- ✅ You want consistent image sizes and formats
- ✅ Storage optimization is important

**Use `/api/v1/upload/batch` when**:
- ✅ You need to upload multiple files quickly
- ✅ You want original files without processing
- ✅ Uploading gallery images that need full resolution
- ✅ You're uploading documents or other non-image files (if supported)

### Recommended Approach for Restaurants/Reviews

For restaurant and review image uploads, use `/api/v1/upload/image` with individual uploads:

```typescript
// ✅ Recommended: Individual uploads with optimization
const uploadAllFiles = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadFileToS3(file));
  return Promise.all(uploadPromises);
};

const uploadFileToS3 = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/v1/upload/image", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return data.fileUrl;
};
```

This approach:
- ✅ Optimizes images automatically
- ✅ Reduces storage costs
- ✅ Improves page load times
- ✅ Maintains consistent image quality

---

### Environment Variables Setup

**Required Variables** (must be set in `.env` or `.env.local`):

```bash
# AWS S3 Credentials
S3_ACCESS_KEY_ID="AKIAUJJYJXEZ5DERETX6"
S3_SECRET_ACCESS_KEY="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"

# S3 Bucket Configuration
S3_BUCKET_NAME="tastyplates-bucket"
S3_REGION="ap-northeast-2"
S3_BUCKET_DOMAIN="https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com"
```

**Optional Variables** (for `/api/v1/upload/image` only):

```bash
# Image Processing Configuration
IMAGE_MAX_WIDTH=1600      # Maximum width in pixels (default: 1600)
IMAGE_MAX_HEIGHT=1600     # Maximum height in pixels (default: 1600)
IMAGE_WEBP_QUALITY=75     # WebP quality 0-100 (default: 75)
```

**Variable Usage Summary**:

| Variable | Used By | Purpose |
|----------|---------|---------|
| `S3_ACCESS_KEY_ID` | Both endpoints | AWS authentication |
| `S3_SECRET_ACCESS_KEY` | Both endpoints | AWS authentication |
| `S3_REGION` | Both endpoints | AWS region for S3 client |
| `S3_BUCKET_NAME` | Both endpoints | Target S3 bucket name |
| `S3_BUCKET_DOMAIN` | Both endpoints | Public URL domain for uploaded files |
| `IMAGE_MAX_WIDTH` | `/api/v1/upload/image` only | Max image width for resizing |
| `IMAGE_MAX_HEIGHT` | `/api/v1/upload/image` only | Max image height for resizing |
| `IMAGE_WEBP_QUALITY` | `/api/v1/upload/image` only | WebP compression quality |

**URL Construction Logic**:

Both endpoints use the same logic to construct the final public URL:

```typescript
// If S3_BUCKET_DOMAIN is provided and includes protocol
const fileUrl = "https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com/uploads/2024/01/image.webp"

// If S3_BUCKET_DOMAIN is not provided, constructs from bucket name and region
const fileUrl = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/uploads/2024/01/image.webp`
```

**Security Note**: 
- Never commit `.env` files to version control
- Use `.env.local` for local development
- Use environment variable management in production (e.g., Vercel, AWS Secrets Manager)

---

## Database Storage

### Restaurants

**Table**: `restaurants`

**Fields**:
- `uploaded_images`: JSONB array of S3 URLs
  ```json
  ["https://domain.com/uploads/2024/01/image1.webp", "https://domain.com/uploads/2024/01/image2.webp"]
  ```
- `featured_image_url`: String (single S3 URL)
  ```json
  "https://domain.com/uploads/2024/01/image1.webp"
  ```

**GraphQL Mutation**:
```graphql
mutation CreateRestaurant($object: restaurants_insert_input!) {
  insert_restaurants_one(object: $object) {
    id
    uploaded_images
    featured_image_url
  }
}
```

### Reviews

**Table**: `restaurant_reviews`

**Fields**:
- `images`: JSONB array of S3 URLs
  ```json
  ["https://domain.com/uploads/2024/01/review_image1.webp", "https://domain.com/uploads/2024/01/review_image2.webp"]
  ```

**GraphQL Mutation**:
```graphql
mutation CreateReview($object: restaurant_reviews_insert_input!) {
  insert_restaurant_reviews_one(object: $object) {
    id
    images
  }
}
```

---

## Code Examples

### Complete Restaurant Create Example

```typescript
"use client";

import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export default function CreateRestaurantPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    featured_image_url: "",
    // ... other fields
  });

  // Upload single file to S3
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl;
  };

  // Upload all pending files
  // Option 1: Individual uploads with optimization (recommended)
  const uploadAllFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToS3(file));
    return Promise.all(uploadPromises);
  };

  // Option 2: Batch upload without optimization (alternative)
  // Use this if you need original files without processing
  // const uploadAllFilesBatch = async (files: File[]): Promise<string[]> => {
  //   if (files.length > 10) {
  //     throw new Error("Maximum 10 files allowed per batch");
  //   }
  //
  //   const formData = new FormData();
  //   files.forEach(file => {
  //     formData.append("files", file);
  //   });
  //
  //   const response = await fetch("/api/v1/upload/batch", {
  //     method: "POST",
  //     body: formData,
  //   });
  //
  //   if (!response.ok) {
  //     const error = await response.json();
  //     throw new Error(error.error || "Batch upload failed");
  //   }
  //
  //   const data = await response.json();
  //   if (data.errors && data.errors.length > 0) {
  //     console.warn("Some files failed:", data.errors);
  //   }
  //   return data.files?.map((f: { fileUrl: string }) => f.fileUrl) || [];
  // };

  // Handle featured image change
  const handleFeaturedImageChange = useCallback((url: string | null) => {
    setFormData(prev => ({ ...prev, featured_image_url: url || "" }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload pending files first
      let finalImageUrls = [...uploadedImages];
      if (pendingFiles.length > 0) {
        toast.info(`Uploading ${pendingFiles.length} image(s)...`);
        try {
          const uploadedUrls = await uploadAllFiles(pendingFiles);
          finalImageUrls = [...uploadedImages, ...uploadedUrls];
          setUploadedImages(finalImageUrls);
          toast.success("All images uploaded successfully!");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
          toast.error(`Failed to upload images: ${errorMessage}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Filter out blob URLs - only keep actual S3 URLs
      finalImageUrls = finalImageUrls.filter(url => {
        if (!url || typeof url !== 'string') return false;
        if (url.startsWith('blob:')) return false;
        return url.startsWith('http://') || url.startsWith('https://');
      });

      // Ensure featured_image_url is not a blob URL
      let featuredImageUrl = formData.featured_image_url.trim() || undefined;
      if (featuredImageUrl && featuredImageUrl.startsWith('blob:')) {
        featuredImageUrl = undefined;
      } else if (featuredImageUrl && !featuredImageUrl.startsWith('http://') && !featuredImageUrl.startsWith('https://')) {
        featuredImageUrl = undefined;
      }

      // Create restaurant
      const result = await restaurantV2Service.createRestaurant({
        title: formData.title,
        uploaded_images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        featured_image_url: featuredImageUrl,
        // ... other fields
      });

      if (result.success) {
        toast.success("Restaurant created successfully!");
        router.push("/dashboard/admin/restaurant-listings");
      } else {
        toast.error(result.error || "Failed to create restaurant");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ImageUploadDnd
        images={uploadedImages}
        onImagesChange={setUploadedImages}
        onFilesChange={setPendingFiles}
        featuredImageUrl={formData.featured_image_url}
        onFeaturedImageChange={handleFeaturedImageChange}
        maxImages={20}
        disabled={isSubmitting}
      />
      {/* ... rest of form */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Restaurant"}
      </button>
    </form>
  );
}
```

### Complete Review Create Example

```typescript
"use client";

import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export default function CreateReviewPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    title: "",
    rating: 0,
    restaurant_uuid: "",
  });

  // Upload functions (same as restaurant)
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl;
  };

  const uploadAllFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToS3(file));
    return Promise.all(uploadPromises);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload pending files first
      let finalImageUrls = [...uploadedImages];
      if (pendingFiles.length > 0) {
        toast.info(`Uploading ${pendingFiles.length} image(s)...`);
        try {
          const uploadedUrls = await uploadAllFiles(pendingFiles);
          finalImageUrls = [...uploadedImages, ...uploadedUrls];
          setUploadedImages(finalImageUrls);
          toast.success("All images uploaded successfully!");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
          toast.error(`Failed to upload images: ${errorMessage}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Filter out blob URLs
      finalImageUrls = finalImageUrls.filter(url => {
        if (!url || typeof url !== 'string') return false;
        if (url.startsWith('blob:')) return false;
        return url.startsWith('http://') || url.startsWith('https://');
      });

      // Create review
      const result = await reviewV2Service.createReview({
        author_id: currentUser.id,
        restaurant_uuid: formData.restaurant_uuid,
        content: formData.content,
        title: formData.title,
        rating: formData.rating,
        images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      });

      if (result.success) {
        toast.success("Review created successfully!");
        router.push("/reviews");
      } else {
        toast.error(result.error || "Failed to create review");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Review content fields */}
      <textarea
        value={formData.content}
        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
        placeholder="Write your review..."
      />

      {/* Image upload */}
      <div className="space-y-4">
        <h3>Add Photos</h3>
        <ImageUploadDnd
          images={uploadedImages}
          onImagesChange={setUploadedImages}
          onFilesChange={setPendingFiles}
          maxImages={10}
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
```

### Reusable Upload Hook

```typescript
// hooks/use-image-upload.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseImageUploadOptions {
  useBatch?: boolean; // Use batch endpoint instead of individual uploads
  maxBatchSize?: number; // Max files per batch (default: 10)
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { useBatch = false, maxBatchSize = 10 } = options;
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Single file upload with optimization
  const uploadFileToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.fileUrl;
  };

  // Batch file upload (no optimization)
  const uploadBatchFiles = async (files: File[]): Promise<string[]> => {
    if (files.length > maxBatchSize) {
      throw new Error(`Maximum ${maxBatchSize} files allowed per batch`);
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    const response = await fetch("/api/v1/upload/batch", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Batch upload failed");
    }

    const data = await response.json();
    
    if (data.errors && data.errors.length > 0) {
      console.warn("Some files failed to upload:", data.errors);
      // Optionally throw error if all files failed
      if (data.files.length === 0) {
        throw new Error(`All uploads failed: ${data.errors.map((e: { error: string }) => e.error).join(', ')}`);
      }
    }

    return data.files?.map((f: { fileUrl: string }) => f.fileUrl) || [];
  };

  const uploadAllFiles = useCallback(async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    try {
      let urls: string[];
      
      if (useBatch) {
        // Use batch endpoint
        urls = await uploadBatchFiles(files);
      } else {
        // Use individual uploads with optimization
        const uploadPromises = files.map(file => uploadFileToS3(file));
        urls = await Promise.all(uploadPromises);
      }
      
      setIsUploading(false);
      return urls;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  }, [useBatch]);

  const handleUploadPendingFiles = useCallback(async (): Promise<string[]> => {
    if (pendingFiles.length === 0) {
      return uploadedImages;
    }

    try {
      toast.info(`Uploading ${pendingFiles.length} image(s)...`);
      const uploadedUrls = await uploadAllFiles(pendingFiles);
      const finalUrls = [...uploadedImages, ...uploadedUrls];
      setUploadedImages(finalUrls);
      setPendingFiles([]);
      toast.success("All images uploaded successfully!");
      return finalUrls;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
      toast.error(`Failed to upload images: ${errorMessage}`);
      throw error;
    }
  }, [pendingFiles, uploadedImages, uploadAllFiles]);

  const getFinalImageUrls = useCallback((): string[] => {
    return uploadedImages.filter(url => {
      if (!url || typeof url !== 'string') return false;
      if (url.startsWith('blob:')) return false;
      return url.startsWith('http://') || url.startsWith('https://');
    });
  }, [uploadedImages]);

  return {
    uploadedImages,
    setUploadedImages,
    pendingFiles,
    setPendingFiles,
    isUploading,
    uploadAllFiles,
    handleUploadPendingFiles,
    getFinalImageUrls,
  };
}
```

**Usage (Individual Uploads with Optimization)**:
```typescript
// For restaurants/reviews - uses /api/v1/upload/image
const {
  uploadedImages,
  setUploadedImages,
  pendingFiles,
  setPendingFiles,
  isUploading,
  handleUploadPendingFiles,
  getFinalImageUrls,
} = useImageUpload({ useBatch: false });

// In form submit
const finalImageUrls = await handleUploadPendingFiles();
const cleanUrls = getFinalImageUrls();
```

**Usage (Batch Upload - No Optimization)**:
```typescript
// For gallery or original files - uses /api/v1/upload/batch
const {
  uploadedImages,
  setUploadedImages,
  pendingFiles,
  setPendingFiles,
  isUploading,
  handleUploadPendingFiles,
  getFinalImageUrls,
} = useImageUpload({ useBatch: true, maxBatchSize: 10 });

// In form submit
const finalImageUrls = await handleUploadPendingFiles();
const cleanUrls = getFinalImageUrls();
```

### Batch Upload Example (Alternative Approach)

If you need to upload files without optimization (original files), you can use the batch endpoint:

```typescript
"use client";

import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { useState } from "react";
import { toast } from "sonner";

export default function GalleryUploadPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch upload function (no optimization)
  const uploadBatchFiles = async (files: File[]): Promise<string[]> => {
    if (files.length > 10) {
      throw new Error("Maximum 10 files allowed per batch");
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    const response = await fetch("/api/v1/upload/batch", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Batch upload failed");
    }

    const data = await response.json();
    
    // Handle partial failures
    if (data.errors && data.errors.length > 0) {
      console.warn("Some files failed to upload:", data.errors);
      data.errors.forEach((err: { fileName: string; error: string }) => {
        toast.error(`${err.fileName}: ${err.error}`);
      });
    }

    // Return successful upload URLs
    return data.files?.map((f: { fileUrl: string }) => f.fileUrl) || [];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload pending files using batch endpoint
      let finalImageUrls = [...uploadedImages];
      if (pendingFiles.length > 0) {
        toast.info(`Uploading ${pendingFiles.length} file(s)...`);
        try {
          const uploadedUrls = await uploadBatchFiles(pendingFiles);
          finalImageUrls = [...uploadedImages, ...uploadedUrls];
          setUploadedImages(finalImageUrls);
          toast.success(`${uploadedUrls.length} file(s) uploaded successfully!`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';
          toast.error(`Failed to upload files: ${errorMessage}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Filter out blob URLs
      finalImageUrls = finalImageUrls.filter(url => {
        if (!url || typeof url !== 'string') return false;
        if (url.startsWith('blob:')) return false;
        return url.startsWith('http://') || url.startsWith('https://');
      });

      // Save to database or perform other actions
      console.log("Final image URLs:", finalImageUrls);
      
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ImageUploadDnd
        images={uploadedImages}
        onImagesChange={setUploadedImages}
        onFilesChange={setPendingFiles}
        maxImages={10}  // Batch endpoint limit
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload Files"}
      </button>
    </form>
  );
}
```

**Key Differences from Single Upload**:
- Uses `/api/v1/upload/batch` endpoint
- Files are uploaded **as-is** (no WebP conversion, no resizing)
- Path structure: `gallery/{timestamp}-{random}.{extension}` (not `uploads/YYYY/MM/`)
- Returns array with both successful and failed uploads
- Maximum 10 files per batch request

---

## Best Practices

### 1. Blob URL Management

**Always clean up blob URLs**:
```typescript
// ImageUploadDnd handles this automatically, but if you create blob URLs manually:
useEffect(() => {
  return () => {
    // Cleanup on unmount
    imageFiles.forEach(img => {
      if (img.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
  };
}, [imageFiles]);
```

### 2. Error Handling

**Always handle upload errors gracefully**:
```typescript
try {
  const uploadedUrls = await uploadAllFiles(pendingFiles);
  // Success
} catch (error) {
  // Show user-friendly error
  toast.error("Failed to upload images. Please try again.");
  // Don't proceed with form submission
  return;
}
```

### 3. Filter Blob URLs Before Saving

**Always filter out blob URLs before saving to database**:
```typescript
const finalImageUrls = uploadedImages.filter(url => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('blob:')) return false;
  return url.startsWith('http://') || url.startsWith('https://');
});
```

### 4. Upload Before Form Submission

**Upload images before submitting the form**:
```typescript
// ✅ Good: Upload first, then submit
const uploadedUrls = await uploadAllFiles(pendingFiles);
await createRestaurant({ uploaded_images: uploadedUrls });

// ❌ Bad: Submit form with blob URLs
await createRestaurant({ uploaded_images: uploadedImages }); // Contains blob URLs!
```

### 5. Loading States

**Show loading states during upload**:
```typescript
if (isUploading) {
  return <div>Uploading images...</div>;
}
```

### 6. Featured Image Handling

**Handle featured image blob → S3 URL conversion**:
```typescript
// If featured image is a blob URL, clear it or find corresponding S3 URL
if (featuredImageUrl && featuredImageUrl.startsWith('blob:')) {
  // Option 1: Clear it
  featuredImageUrl = undefined;
  
  // Option 2: Use first uploaded image
  featuredImageUrl = finalImageUrls[0];
}
```

### 7. Image Limits

**Set appropriate limits**:
```typescript
// Restaurants: More images allowed
<ImageUploadDnd maxImages={20} />

// Reviews: Fewer images
<ImageUploadDnd maxImages={10} />
```

---

## Troubleshooting

### Issue: Blob URLs in Database

**Problem**: Blob URLs are being saved to the database instead of S3 URLs.

**Solution**: Always filter blob URLs before saving:
```typescript
const finalImageUrls = uploadedImages.filter(url => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('blob:')) return false;
  return url.startsWith('http://') || url.startsWith('https://');
});
```

### Issue: Memory Leaks

**Problem**: Blob URLs not being cleaned up, causing memory leaks.

**Solution**: ImageUploadDnd handles this automatically, but ensure cleanup:
```typescript
useEffect(() => {
  return () => {
    imageFiles.forEach(img => {
      if (img.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
  };
}, [imageFiles]);
```

### Issue: Upload Fails

**Problem**: Images fail to upload to S3.

**Check**:
1. **Environment variables are set correctly**:
   ```bash
   # Verify these are set in .env or .env.local
   S3_ACCESS_KEY_ID="AKIAUJJYJXEZ5DERETX6"
   S3_SECRET_ACCESS_KEY="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"
   S3_BUCKET_DOMAIN="https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com"
   S3_REGION="ap-northeast-2"
   S3_BUCKET_NAME="tastyplates-bucket"
   ```
2. **S3 bucket permissions** allow uploads (PutObject permission)
3. **CORS is configured correctly** in S3 bucket settings
4. **File size is under 10MB**
5. **File type is allowed** (JPEG, PNG, WebP, GIF)
6. **AWS credentials are valid** and not expired
7. **S3 bucket exists** in the specified region

### Issue: Environment Variables Not Loading

**Problem**: API returns "Missing required environment variables" error.

**Solutions**:
1. **Check file location**: Environment variables should be in `.env.local` (for Next.js)
2. **Restart development server**: Environment variables are loaded at startup
3. **Check variable names**: Must match exactly (case-sensitive):
   - ✅ `S3_ACCESS_KEY_ID` (correct)
   - ❌ `S3_ACCESS_KEY` (incorrect)
   - ❌ `AWS_ACCESS_KEY_ID` (incorrect)
4. **Verify no quotes**: In `.env` file, values should not have extra quotes:
   ```bash
   # ✅ Correct
   S3_ACCESS_KEY_ID=AKIAUJJYJXEZ5DERETX6
   
   # ❌ Incorrect (extra quotes)
   S3_ACCESS_KEY_ID="AKIAUJJYJXEZ5DERETX6"
   ```
5. **Check for typos**: Variable names must match exactly

### Issue: Images Not Displaying

**Problem**: Images don't display after upload.

**Check**:
1. **S3 bucket has public read access** (bucket policy allows GetObject)
2. **URLs are correct**: Check `S3_BUCKET_DOMAIN` matches your bucket:
   ```typescript
   // Should match: https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com
   console.log(process.env.S3_BUCKET_DOMAIN);
   ```
3. **Next.js Image component** is configured for S3 domain in `next.config.js`:
   ```javascript
   module.exports = {
     images: {
       domains: [
         'tastyplates-bucket.s3.ap-northeast-2.amazonaws.com',
       ],
     },
   };
   ```
4. **Images are actually uploaded**: Check S3 bucket console
5. **CORS configuration**: Ensure S3 bucket CORS allows GET requests from your domain

### Issue: Wrong URL Format

**Problem**: Uploaded image URLs are incorrect or don't work.

**Check**:
1. **S3_BUCKET_DOMAIN format**: Should include protocol:
   ```bash
   # ✅ Correct
   S3_BUCKET_DOMAIN="https://tastyplates-bucket.s3.ap-northeast-2.amazonaws.com"
   
   # ❌ Incorrect (missing protocol)
   S3_BUCKET_DOMAIN="tastyplates-bucket.s3.ap-northeast-2.amazonaws.com"
   ```
2. **URL construction**: The API automatically adds protocol if missing, but it's better to include it
3. **Region matches**: Ensure `S3_REGION` matches your bucket's actual region

### Issue: Featured Image Not Updating

**Problem**: Featured image doesn't update when blob URL converts to S3 URL.

**Solution**: ImageUploadDnd handles this automatically via `onFeaturedImageChange` callback. Ensure you're using it:
```typescript
<ImageUploadDnd
  onFeaturedImageChange={handleFeaturedImageChange}
  // ... other props
/>
```

---

## Summary

This guide documents the client-side S3 image upload system used for restaurants and reviews. Key points:

1. **ImageUploadDnd Component**: Handles drag-and-drop, preview, and reordering
2. **Blob URL Management**: Creates preview URLs, replaces with S3 URLs after upload
3. **Upload Flow**: Files → Blob URLs → Upload to S3 → S3 URLs → Database
4. **Database Storage**: JSONB arrays for multiple images, strings for single images
5. **Automatic Optimization**: WebP conversion and image optimization via Sharp

### Quick Reference

- **Component**: `ImageUploadDnd` from `@/components/ui/image-upload-dnd`
- **API Endpoints**: 
  - `POST /api/v1/upload/image` - Single file with optimization (recommended)
  - `POST /api/v1/upload/batch` - Multiple files without optimization
- **Upload Functions**: 
  - `uploadFileToS3(file: File): Promise<string>` - Single upload
  - `uploadBatchFiles(files: File[]): Promise<string[]>` - Batch upload
- **Environment Variables**:
  - `S3_ACCESS_KEY_ID` - AWS access key
  - `S3_SECRET_ACCESS_KEY` - AWS secret key
  - `S3_BUCKET_NAME` - S3 bucket name
  - `S3_REGION` - AWS region
  - `S3_BUCKET_DOMAIN` - Public URL domain
- **Database Fields**: 
  - Restaurants: `uploaded_images` (JSONB), `featured_image_url` (string)
  - Reviews: `images` (JSONB)

---

**Last Updated**: January 2024
