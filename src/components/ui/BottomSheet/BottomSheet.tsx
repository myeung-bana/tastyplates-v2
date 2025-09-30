"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = "90vh",
  className = "",
}) => {
  const [sheetPosition, setSheetPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Touch handlers for swipe-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0]?.clientY ?? 0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0]?.clientY ?? 0;
    const deltaY = currentY - startY;
    
    // Only allow downward swipes
    if (deltaY > 0) {
      setSheetPosition(Math.min(deltaY, 100));
    }
  }, [isDragging, startY]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If swiped down more than 100px, close the modal
    if (sheetPosition > 100) {
      onClose();
    } else {
      setSheetPosition(0);
    }
  }, [isDragging, sheetPosition, onClose]);

  // Handle backdrop click with slide-down animation
  const handleBackdropClick = useCallback(() => {
    if (isClosing) return; // Prevent multiple clicks during animation
    
    setIsClosing(true);
    // Animate slide down
    setSheetPosition(300); // Slide down beyond viewport
    
    // Close after animation completes
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSheetPosition(0); // Reset for next open
    }, 300); // Match the CSS transition duration
  }, [isClosing, onClose]);

  // Reset position when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSheetPosition(0);
      setIsDragging(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={handleBackdropClick}
      />
      
      {/* Bottom Sheet */}
      <div 
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col ${className} ${isClosing ? 'pointer-events-none' : ''}`}
        style={{
          maxHeight,
          transform: `translateY(${sheetPosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header with Title (optional) */}
        {title && (
          <div className="px-4 pb-2 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
