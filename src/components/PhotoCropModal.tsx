import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IoClose, IoCheckmark, IoRefresh } from 'react-icons/io5';

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

  // Initialize image and container
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageLoaded(true);
      setOriginalImageSize({ width: img.width, height: img.height });
      
      // Calculate initial scale and position
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // Calculate scale to fit image in container with some padding
        const padding = 40;
        const availableWidth = containerWidth - padding;
        const availableHeight = containerHeight - padding;
        
        const scaleX = availableWidth / img.width;
        const scaleY = availableHeight / img.height;
        const initialScale = Math.min(scaleX, scaleY, 1);
        
        setContainerSize({ width: containerWidth, height: containerHeight });
        
        // Center the image initially
        const scaledWidth = img.width * initialScale;
        const scaledHeight = img.height * initialScale;
        setImagePosition({
          x: (containerWidth - scaledWidth) / 2,
          y: (containerHeight - scaledHeight) / 2,
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
      setIsDragging(true);
      setDragStart({ x: x - imagePosition.x, y: y - imagePosition.y });
    }
  }, [imageLoaded, imagePosition, originalImageSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    // Keep image within reasonable bounds (allow some overflow for better UX)
    const scaledWidth = originalImageSize.width * imagePosition.scale;
    const scaledHeight = originalImageSize.height * imagePosition.scale;
    const margin = 50; // Allow 50px overflow on each side
    
    setImagePosition(prev => ({
      ...prev,
      x: Math.max(-scaledWidth + margin, Math.min(newX, containerSize.width - margin)),
      y: Math.max(-scaledHeight + margin, Math.min(newY, containerSize.height - margin)),
    }));
  }, [isDragging, dragStart, imagePosition.scale, originalImageSize, containerSize, imageLoaded]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setImagePosition(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta)),
    }));
  }, []);

  // Reset image position and scale
  const resetCrop = useCallback(() => {
    if (!imageLoaded || !originalImageSize.width) return;
    
    const padding = 40;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;
    
    const scaleX = availableWidth / originalImageSize.width;
    const scaleY = availableHeight / originalImageSize.height;
    const initialScale = Math.min(scaleX, scaleY, 1);
    
    const scaledWidth = originalImageSize.width * initialScale;
    const scaledHeight = originalImageSize.height * initialScale;
    
    setImagePosition({
      x: (containerSize.width - scaledWidth) / 2,
      y: (containerSize.height - scaledHeight) / 2,
      scale: initialScale,
    });
  }, [imageLoaded, containerSize, originalImageSize]);

  // Crop and process image
  const handleCrop = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    
    // Set canvas size for circular crop (256x256 for high quality)
    const cropSize = 256;
    canvas.width = cropSize;
    canvas.height = cropSize;
    
    // Calculate the circular crop area in the container
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const radius = Math.min(containerSize.width, containerSize.height) / 2 - 20; // 20px margin
    
    // Calculate the source coordinates in the original image
    const sourceX = (centerX - radius - imagePosition.x) / imagePosition.scale;
    const sourceY = (centerY - radius - imagePosition.y) / imagePosition.scale;
    const sourceSize = (radius * 2) / imagePosition.scale;
    
    // Ensure source coordinates are within image bounds
    const clampedSourceX = Math.max(0, Math.min(sourceX, img.width - sourceSize));
    const clampedSourceY = Math.max(0, Math.min(sourceY, img.height - sourceSize));
    const clampedSourceSize = Math.min(sourceSize, img.width - clampedSourceX, img.height - clampedSourceY);
    
    // Clear canvas
    ctx.clearRect(0, 0, cropSize, cropSize);
    
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
  }, [imagePosition, containerSize, onCrop, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[2000] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Position Your Avatar</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoClose className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Image Container */}
        <div className="p-2 sm:p-4 flex-1 flex items-center justify-center">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
            style={{ 
              width: 'min(400px, 90vw)', 
              height: 'min(400px, 90vw)',
              maxWidth: '400px',
              maxHeight: '400px'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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
                  className="absolute cursor-move select-none"
                  style={{
                    left: imagePosition.x,
                    top: imagePosition.y,
                    width: originalImageSize.width * imagePosition.scale,
                    height: originalImageSize.height * imagePosition.scale,
                    transform: 'translateZ(0)', // Hardware acceleration
                  }}
                />
                
                {/* Circular Crop Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50" />
                  
                  {/* Circular cutout */}
                  <div
                    className="absolute border-4 border-orange-500 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: Math.min(containerSize.width, containerSize.height) - 40,
                      height: Math.min(containerSize.width, containerSize.height) - 40,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                  
                  {/* Center crosshair */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-orange-500 opacity-60" />
                    <div className="w-0.5 h-8 bg-orange-500 opacity-60 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center mt-2 px-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Drag to position your photo • Use zoom controls to adjust size
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-3 gap-2 px-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handleZoom(-0.1)}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                disabled={!imageLoaded}
              >
                Zoom Out
              </button>
              <button
                onClick={() => handleZoom(0.1)}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                disabled={!imageLoaded}
              >
                Zoom In
              </button>
              <button
                onClick={resetCrop}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors"
                disabled={!imageLoaded}
              >
                <IoRefresh className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
            
            <div className="text-xs sm:text-sm text-gray-500">
              Scale: {Math.round(imagePosition.scale * 100)}%
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="px-4 sm:px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-1 sm:gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={!imageLoaded}
          >
            <IoCheckmark className="w-4 h-4" />
            <span className="hidden sm:inline">Apply Crop</span>
            <span className="sm:hidden">Apply</span>
          </button>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoCropModal;
