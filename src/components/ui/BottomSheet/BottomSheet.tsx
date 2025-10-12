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

  // Touch handlers for swipe-to-close with improved detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start dragging if touch starts in the handle area or near the top
    const touchY = e.touches[0]?.clientY ?? 0;
    const sheetTop = sheetRef.current?.getBoundingClientRect().top ?? 0;
    const touchOffset = touchY - sheetTop;
    
    // Allow dragging if touch is within the first 60px of the sheet (handle area)
    if (touchOffset <= 60) {
      setIsDragging(true);
      setStartY(touchY);
      e.preventDefault(); // Prevent scrolling during drag
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0]?.clientY ?? 0;
    const deltaY = currentY - startY;
    
    // Only allow downward swipes
    if (deltaY > 0) {
      setSheetPosition(Math.min(deltaY, 200)); // Increased max distance for better feedback
      e.preventDefault(); // Prevent scrolling during drag
    }
  }, [isDragging, startY]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If swiped down more than 80px, close the modal (reduced threshold)
    if (sheetPosition > 80) {
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
    <div className="fixed inset-0 z-50 font-neusans">
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
        {/* Enhanced Swipe Handle Area */}
        <div className="flex flex-col items-center py-4 cursor-grab active:cursor-grabbing relative">
          {/* Main handle */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
          
          {/* Additional visual cues for swipe area */}
          <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
          
          {/* Invisible touch area for better swipe detection */}
          <div className="absolute top-0 left-0 right-0 h-16 cursor-grab active:cursor-grabbing" />
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
