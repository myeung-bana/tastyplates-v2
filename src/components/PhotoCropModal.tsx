import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import { IoCheckmark, IoRefresh } from 'react-icons/io5';
import { PHOTO_CROP_CONSTANTS } from '@/constants/photoCrop';
import "@/styles/components/_review-modal.scss";

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  imageSrc: string;
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
}

const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  onClose,
  onCrop,
  imageSrc,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 0, y: 0, scale: 1 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [minScale, setMinScale] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { MAX_SCALE, CROP_DIAMETER, MIN_IMAGE_REQUIREMENTS } = PHOTO_CROP_CONSTANTS;

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const getCropMetrics = () => {
    const width = containerSize.width;
    const height = containerSize.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = CROP_DIAMETER / 2;
    const diameter = CROP_DIAMETER;
    const cropLeft = centerX - radius;
    const cropTop = centerY - radius;
    return { centerX, centerY, radius, diameter, cropLeft, cropTop };
  };

  const getDragBounds = (scaledWidth: number, scaledHeight: number) => {
    const { cropLeft, cropTop, diameter } = getCropMetrics();
    // Ensure the crop square is fully covered by the image
    const minX = cropLeft + diameter - scaledWidth;
    const maxX = cropLeft;
    const minY = cropTop + diameter - scaledHeight;
    const maxY = cropTop;
    return { minX, maxX, minY, maxY };
  };

  // Initialize image and container
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageLoaded(true);
      setOriginalImageSize({ width: img.width, height: img.height });
      // Validate image size and aspect ratio
      const aspect = img.width / img.height;
      if (
        img.width < MIN_IMAGE_REQUIREMENTS.width ||
        img.height < MIN_IMAGE_REQUIREMENTS.height
      ) {
        setValidationError(
          `Image too small. Minimum ${MIN_IMAGE_REQUIREMENTS.width}x${MIN_IMAGE_REQUIREMENTS.height}px`
        );
      } else if (
        aspect < MIN_IMAGE_REQUIREMENTS.aspectRatioMin ||
        aspect > MIN_IMAGE_REQUIREMENTS.aspectRatioMax
      ) {
        setValidationError(
          "Image aspect ratio is extreme. Please use a more square image."
        );
      } else {
        setValidationError(null);
      }
      
      // Calculate initial scale and position
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        setContainerSize({ width: containerWidth, height: containerHeight });
        
        // Detect image orientation
        const aspectRatio = img.width / img.height;
        const isPortrait = aspectRatio < 1;
        const isLandscape = aspectRatio > 1;
        const isSquare = Math.abs(aspectRatio - 1) < 0.1;
        
        // Calculate minimum scale to fully cover the fixed crop circle
        // For portrait images, we need to ensure width covers the crop diameter
        // For landscape images, we need to ensure height covers the crop diameter
        let minScaleToCover;
        if (isPortrait) {
          // Portrait: scale based on width to ensure crop circle is covered
          minScaleToCover = CROP_DIAMETER / img.width;
        } else if (isLandscape) {
          // Landscape: scale based on height to ensure crop circle is covered
          minScaleToCover = CROP_DIAMETER / img.height;
        } else {
          // Square: use the smaller dimension
          minScaleToCover = CROP_DIAMETER / Math.min(img.width, img.height);
        }
        
        const computedMinScale = Math.max(0.1, minScaleToCover); // Allow smaller minimum for better UX
        setMinScale(computedMinScale);

        // Choose initial scale: for portraits, start a bit larger to show more of the subject
        let initialScale;
        if (isPortrait) {
          // For portraits, start with a scale that shows a good portion of the image
          initialScale = Math.max(computedMinScale, CROP_DIAMETER / Math.min(img.width, img.height));
        } else {
          // For landscape and square, use the minimum scale
          initialScale = computedMinScale;
        }
        
        initialScale = clamp(initialScale, computedMinScale, MAX_SCALE);
        
        // Center the image relative to the crop circle, not the container
        const scaledWidth = img.width * initialScale;
        const scaledHeight = img.height * initialScale;
        
        // Get crop area metrics for proper centering
        const tempContainerSize = { width: containerWidth, height: containerHeight };
        const { centerX: cropCenterX, centerY: cropCenterY } = (() => {
          const width = tempContainerSize.width;
          const height = tempContainerSize.height;
          return {
            centerX: width / 2,
            centerY: height / 2
          };
        })();
        
        // Position image based on orientation for optimal initial view
        let centeredX, centeredY;
        
        if (isPortrait) {
          // For portrait images, center horizontally and position vertically to show upper portion (faces usually in upper third)
          centeredX = cropCenterX - scaledWidth / 2;
          centeredY = cropCenterY - scaledHeight / 3; // Show upper third of the image
        } else if (isLandscape) {
          // For landscape images, center both axes
          centeredX = cropCenterX - scaledWidth / 2;
          centeredY = cropCenterY - scaledHeight / 2;
        } else {
          // For square images, center both axes
          centeredX = cropCenterX - scaledWidth / 2;
          centeredY = cropCenterY - scaledHeight / 2;
        }
        
        // Apply drag bounds to ensure crop area is covered
        const { minX, maxX, minY, maxY } = getDragBounds(scaledWidth, scaledHeight);
        
        setImagePosition({
          x: clamp(centeredX, minX, maxX),
          y: clamp(centeredY, minY, maxY),
          scale: initialScale,
        });
      }
    };
    img.onerror = () => {
      console.error('Failed to load image');
      setImageLoaded(false);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Handle mouse events for dragging image
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageLoaded) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is on the image
    const scaledWidth = originalImageSize.width * imagePosition.scale;
    const scaledHeight = originalImageSize.height * imagePosition.scale;
    
    if (
      x >= imagePosition.x &&
      x <= imagePosition.x + scaledWidth &&
      y >= imagePosition.y &&
      y <= imagePosition.y + scaledHeight
    ) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: x - imagePosition.x, y: y - imagePosition.y });
    }
  }, [imageLoaded, imagePosition, originalImageSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded) return;
    
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    // Keep image covering the crop circle fully
    const scaledWidth = originalImageSize.width * imagePosition.scale;
    const scaledHeight = originalImageSize.height * imagePosition.scale;
    const { minX, maxX, minY, maxY } = getDragBounds(scaledWidth, scaledHeight);
    
    setImagePosition(prev => ({
      ...prev,
      x: clamp(newX, minX, maxX),
      y: clamp(newY, minY, maxY),
    }));
  }, [isDragging, dragStart, imagePosition.scale, originalImageSize, containerSize, imageLoaded]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!imageLoaded) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Check if touch is on the image
    const scaledWidth = originalImageSize.width * imagePosition.scale;
    const scaledHeight = originalImageSize.height * imagePosition.scale;
    
    if (
      x >= imagePosition.x &&
      x <= imagePosition.x + scaledWidth &&
      y >= imagePosition.y &&
      y <= imagePosition.y + scaledHeight
    ) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: x - imagePosition.x, y: y - imagePosition.y });
    }
  }, [imageLoaded, imagePosition, originalImageSize]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !imageLoaded) return;
    
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    // Keep image covering the crop circle fully
    const scaledWidth = originalImageSize.width * imagePosition.scale;
    const scaledHeight = originalImageSize.height * imagePosition.scale;
    const { minX, maxX, minY, maxY } = getDragBounds(scaledWidth, scaledHeight);
    
    setImagePosition(prev => ({
      ...prev,
      x: clamp(newX, minX, maxX),
      y: clamp(newY, minY, maxY),
    }));
  }, [isDragging, dragStart, imagePosition.scale, originalImageSize, containerSize, imageLoaded]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setImagePosition(prev => {
      const nextScale = clamp(prev.scale + delta, minScale, MAX_SCALE);
      
      // Calculate the center point of the current crop area
      const { centerX, centerY } = getCropMetrics();
      
      // Calculate the current center relative to the image
      const currentCenterX = centerX - prev.x;
      const currentCenterY = centerY - prev.y;
      
      // Scale the relative center position
      const scaleFactor = nextScale / prev.scale;
      const newCenterX = currentCenterX * scaleFactor;
      const newCenterY = currentCenterY * scaleFactor;
      
      // Calculate new position to maintain the same center point
      const newX = centerX - newCenterX;
      const newY = centerY - newCenterY;
      
      // Apply drag bounds to ensure crop area is covered
      const scaledWidth = originalImageSize.width * nextScale;
      const scaledHeight = originalImageSize.height * nextScale;
      const { minX, maxX, minY, maxY } = getDragBounds(scaledWidth, scaledHeight);
      
      return {
        ...prev,
        scale: nextScale,
        x: clamp(newX, minX, maxX),
        y: clamp(newY, minY, maxY),
      };
    });
  }, [minScale, originalImageSize, containerSize]);

  // Reset image position and scale
  const resetCrop = useCallback(() => {
    if (!imageLoaded || !originalImageSize.width) return;
    
    // Detect image orientation
    const aspectRatio = originalImageSize.width / originalImageSize.height;
    const isPortrait = aspectRatio < 1;
    const isLandscape = aspectRatio > 1;
    
    // Calculate initial scale based on orientation
    let initialScale;
    if (isPortrait) {
      initialScale = Math.max(minScale, CROP_DIAMETER / Math.min(originalImageSize.width, originalImageSize.height));
    } else {
      initialScale = minScale;
    }
    initialScale = clamp(initialScale, minScale, MAX_SCALE);
    
    const scaledWidth = originalImageSize.width * initialScale;
    const scaledHeight = originalImageSize.height * initialScale;
    
    // Center the image relative to the crop circle center based on orientation
    const { centerX: cropCenterX, centerY: cropCenterY } = getCropMetrics();
    
    let centeredX, centeredY;
    if (isPortrait) {
      // For portrait images, center horizontally and show upper portion
      centeredX = cropCenterX - scaledWidth / 2;
      centeredY = cropCenterY - scaledHeight / 3;
    } else {
      // For landscape and square images, center both axes
      centeredX = cropCenterX - scaledWidth / 2;
      centeredY = cropCenterY - scaledHeight / 2;
    }
    
    // Apply drag bounds to ensure crop area is covered
    const { minX, maxX, minY, maxY } = getDragBounds(scaledWidth, scaledHeight);
    
    setImagePosition({
      x: clamp(centeredX, minX, maxX),
      y: clamp(centeredY, minY, maxY),
      scale: initialScale,
    });
  }, [imageLoaded, containerSize, originalImageSize, minScale]);

  // Crop and process image
  const handleCrop = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a new image to ensure we have the original dimensions
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size to fixed 240x240 crop
      const cropSize = CROP_DIAMETER;
      canvas.width = cropSize;
      canvas.height = cropSize;
      
      // Get the actual crop area metrics using consistent function
      const { centerX, centerY, radius, diameter } = getCropMetrics();
      
      // Calculate the crop area in the container coordinates
      const cropLeft = centerX - radius;
      const cropTop = centerY - radius;
      
      // Convert container coordinates to image coordinates
      // When image position is negative, it means the image extends beyond the container
      // We need to find where the crop area intersects with the actual image
      const relativeLeft = cropLeft - imagePosition.x;
      const relativeTop = cropTop - imagePosition.y;
      
      // Convert to source image coordinates using original image dimensions
      const sourceX = relativeLeft / imagePosition.scale;
      const sourceY = relativeTop / imagePosition.scale;
      const sourceSize = diameter / imagePosition.scale;
      // Ensure source coordinates are within image bounds but maintain aspect
      const clampedSourceX = Math.max(0, Math.min(sourceX, img.width - sourceSize));
      const clampedSourceY = Math.max(0, Math.min(sourceY, img.height - sourceSize));
      const clampedSourceSize = Math.min(sourceSize, img.width - clampedSourceX, img.height - clampedSourceY);
      
      // Clear canvas
      ctx.clearRect(0, 0, cropSize, cropSize);
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cropSize, cropSize);
      
      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, 2 * Math.PI);
      ctx.clip();
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        clampedSourceX,
        clampedSourceY,
        clampedSourceSize,
        clampedSourceSize,
        0,
        0,
        cropSize,
        cropSize
      );
      
      ctx.restore();
      
      // Convert to base64
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      onCrop(croppedImage);
      onClose();
    };
    
    img.onerror = () => {
      console.error('Failed to load image for cropping');
    };
    
    img.src = imageSrc;
  }, [imagePosition, containerSize, onCrop, onClose, imageSrc]);

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="photo-crop-modal__container">
        <button className="review-modal__close !top-5" onClick={onClose}>
          <FiX />
        </button>
        
        {/* Header */}
        <div className="photo-crop-modal__header">
          <h2>Position Your Avatar</h2>
        </div>
        {validationError && (
          <div className="photo-crop-modal__validation-error">
            {validationError}
          </div>
        )}

        {/* Image Container */}
        <div className="photo-crop-modal__content">
          <div
            ref={containerRef}
            className="photo-crop-modal__image-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!imageLoaded && (
              <div className="photo-crop-modal__loading">
                <div className="spinner"></div>
              </div>
            )}
            
            {imageLoaded && (
              <>
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Profile preview"
                  className="photo-crop-modal__image"
                  style={{
                    left: imagePosition.x,
                    top: imagePosition.y,
                    width: originalImageSize.width * imagePosition.scale,
                    height: originalImageSize.height * imagePosition.scale,
                  }}
                  draggable={false}
                />
                
                {/* Circular Crop Overlay (fixed 240px) */}
                <div className="photo-crop-modal__overlay">
                  {/* Dark overlay */}
                  <div className="photo-crop-modal__overlay-dark" />
                  
                  {/* Circular cutout */}
                  <div
                    className="photo-crop-modal__overlay-circle"
                    style={{
                      width: CROP_DIAMETER,
                      height: CROP_DIAMETER,
                    }}
                  />
                  
                  {/* Center crosshair */}
                  <div className="photo-crop-modal__overlay-crosshair">
                    <div className="photo-crop-modal__overlay-crosshair-h" />
                    <div className="photo-crop-modal__overlay-crosshair-v" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="photo-crop-modal__instructions">
            <p>Drag to position your photo • Use zoom controls to adjust size</p>
            <p className="photo-crop-modal__instructions-size">
              Final size: 240×240px for high quality
            </p>
          </div>

          {/* Controls */}
          <div className="photo-crop-modal__controls">
            <div className="photo-crop-modal__buttons">
              <button
                onClick={() => handleZoom(-0.1)}
                className="photo-crop-modal__button"
                disabled={!imageLoaded}
              >
                Zoom Out
              </button>
              <button
                onClick={() => handleZoom(0.1)}
                className="photo-crop-modal__button"
                disabled={!imageLoaded}
              >
                Zoom In
              </button>
              <button
                onClick={resetCrop}
                className="photo-crop-modal__button"
                disabled={!imageLoaded}
              >
                <IoRefresh className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
            
            <div className="photo-crop-modal__scale-info">
              Scale: {Math.round(imagePosition.scale * 100)}%
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="photo-crop-modal__footer">
          <button
            onClick={onClose}
            className="photo-crop-modal__cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="photo-crop-modal__apply-btn"
            disabled={!imageLoaded || !!validationError}
          >
            <IoCheckmark className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoCropModal;
