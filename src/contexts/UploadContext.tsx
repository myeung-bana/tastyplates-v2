'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import UploadProgressBar from '@/components/ui/UploadProgressBar';

interface UploadContextType {
  startUpload: (totalFiles: number, message?: string) => void;
  updateProgress: (completed: number, total: number) => void;
  completeUpload: () => void;
  resetUpload: () => void;
  setCustomMessage: (message: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Uploading...');

  const startUpload = useCallback((totalFiles: number, customMessage?: string) => {
    const defaultMessage = totalFiles > 1 
      ? `Uploading ${totalFiles} images...` 
      : 'Uploading image...';
    
    setMessage(customMessage || defaultMessage);
    setProgress(0);
    setIsVisible(true);
  }, []);

  const updateProgress = useCallback((completed: number, total: number) => {
    // Reserve 10% for final processing (upload is 0-90%, processing is 90-100%)
    const uploadProgress = Math.round((completed / total) * 90);
    setProgress(uploadProgress);
    
    // Update message to show current progress
    if (total > 1) {
      setMessage(`Uploading image ${completed}/${total}...`);
    }
  }, []);

  const setCustomMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
  }, []);

  const completeUpload = useCallback(() => {
    setMessage('Publishing review...');
    setProgress(95);
    
    // Simulate final processing
    setTimeout(() => {
      setProgress(100);
      setMessage('Review published!');
      
      // Hide after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 2000);
    }, 500);
  }, []);

  const resetUpload = useCallback(() => {
    setIsVisible(false);
    setProgress(0);
    setMessage('Uploading...');
  }, []);

  return (
    <UploadContext.Provider 
      value={{ 
        startUpload, 
        updateProgress, 
        completeUpload, 
        resetUpload,
        setCustomMessage 
      }}
    >
      <UploadProgressBar 
        isVisible={isVisible} 
        progress={progress} 
        message={message}
        onComplete={() => {}}
      />
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider');
  }
  return context;
}
