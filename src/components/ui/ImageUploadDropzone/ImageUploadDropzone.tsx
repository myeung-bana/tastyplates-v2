"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { FiUpload } from "react-icons/fi"
import Image from "next/image"
import { MdClose } from "react-icons/md"

const dropzoneVariants = cva(
  "relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer",
  {
    variants: {
      variant: {
        default: "border-gray-300 bg-gray-50 hover:border-[#ff7c0a] hover:bg-[#ff7c0a]/5",
        active: "border-[#ff7c0a] bg-[#ff7c0a]/10",
        error: "border-red-300 bg-red-50",
      },
      size: {
        default: "p-8 md:p-12",
        sm: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ImageUploadDropzoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof dropzoneVariants> {
  /**
   * Array of image URLs (base64 data URLs or S3 URLs)
   * Can include both existing images (from database) and new uploads
   */
  images: string[]
  
  /**
   * Callback when images are added
   * Receives array of new image URLs (base64 data URLs)
   */
  onImagesAdd: (imageUrls: string[]) => void
  
  /**
   * Callback when an image is removed
   * Receives the image URL to remove
   */
  onImageRemove: (imageUrl: string) => void
  
  /**
   * Maximum number of images allowed
   */
  maxImages?: number
  
  /**
   * Minimum number of images required
   */
  minImages?: number
  
  /**
   * Error message to display
   */
  error?: string
  
  /**
   * Whether the dropzone is disabled
   */
  disabled?: boolean
  
  /**
   * Accepted file types (default: image/*)
   */
  accept?: string
  
  /**
   * Maximum file size in MB (default: 5)
   */
  maxFileSizeMB?: number
}

const ImageUploadDropzone = React.forwardRef<HTMLDivElement, ImageUploadDropzoneProps>(
  (
    {
      className,
      variant,
      size,
      images,
      onImagesAdd,
      onImageRemove,
      maxImages = 6,
      minImages = 1,
      error,
      disabled = false,
      accept = "image/*",
      maxFileSizeMB = 5,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const processFiles = useCallback(
      async (files: FileList | File[]) => {
        const fileArray = Array.from(files)
        
        // Check total count
        if (images.length + fileArray.length > maxImages) {
          return { error: `Maximum ${maxImages} images allowed` }
        }

        // Validate and process files
        const validFiles: File[] = []
        for (const file of fileArray) {
          // Check file type
          if (!file.type.startsWith("image/")) {
            continue // Skip non-image files
          }

          // Check file size
          const fileSizeMB = file.size / (1024 * 1024)
          if (fileSizeMB > maxFileSizeMB) {
            continue // Skip files that are too large
          }

          validFiles.push(file)
        }

        if (validFiles.length === 0) {
          return { error: "No valid images found" }
        }

        // Convert to base64 data URLs using Promise.all for better error handling
        setIsProcessing(true)
        
        try {
          const imageUrls = await Promise.all(
            validFiles.map((file) => {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => {
                  if (reader.result) {
                    resolve(reader.result as string)
                  } else {
                    reject(new Error('Failed to read file'))
                  }
                }
                reader.onerror = () => {
                  reject(new Error('Failed to read file'))
                }
                reader.readAsDataURL(file)
              })
            })
          )

          setIsProcessing(false)
          onImagesAdd(imageUrls)
          return { success: true }
        } catch (error) {
          setIsProcessing(false)
          console.error('Error processing images:', error)
          return { error: 'Failed to process some images. Please try again.' }
        }
      },
      [images.length, maxImages, maxFileSizeMB, onImagesAdd]
    )

    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    }, [disabled])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
      async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (disabled || isProcessing) return

        const files = e.dataTransfer.files
        if (files.length > 0) {
          await processFiles(files)
        }
      },
      [disabled, isProcessing, processFiles]
    )

    const handleFileInputChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          await processFiles(e.target.files)
          // Reset input so same file can be selected again
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
      },
      [processFiles]
    )

    const handleClick = useCallback(() => {
      if (!disabled && !isProcessing) {
        fileInputRef.current?.click()
      }
    }, [disabled, isProcessing])

    const canAddMore = images.length < maxImages

    return (
      <div className="space-y-4">
        {/* Dropzone */}
        {canAddMore && (
          <div
            ref={ref}
            data-slot="image-upload-dropzone"
            className={cn(
              dropzoneVariants({
                variant: error ? "error" : isDragging ? "active" : variant,
                size,
                className,
              })
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            {...props}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              disabled={disabled || isProcessing}
            />

            <div className="flex flex-col items-center justify-center text-center">
              {isProcessing ? (
                <>
                  <div className="w-12 h-12 border-4 border-[#ff7c0a] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm text-gray-600 font-neusans">
                    Processing images...
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ff7c0a]/10 rounded-full flex items-center justify-center mb-4">
                    <FiUpload className="w-6 h-6 md:w-8 md:h-8 text-[#ff7c0a]" />
                  </div>
                  <p className="text-sm md:text-base font-medium text-[#31343F] mb-2 font-neusans">
                    {isDragging
                      ? "Drop images here"
                      : "Drag and drop images here, or click to browse"}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 font-neusans">
                    Supported: JPG, PNG, GIF (Max {maxFileSizeMB}MB each)
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-neusans">
                    {images.length} / {maxImages} images
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600 font-neusans">{error}</p>
        )}

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div
                key={`${imageUrl.substring(0, 30)}-${index}`}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
              >
                <Image
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={imageUrl.startsWith("data:")}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onImageRemove(imageUrl)
                  }}
                  className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white p-2 shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
                  aria-label="Remove image"
                >
                  <MdClose className="w-4 h-4 text-[#31343F]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

ImageUploadDropzone.displayName = "ImageUploadDropzone"

export { ImageUploadDropzone, dropzoneVariants }

