"use client";
import Image from "next/image";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

interface ImageGalleryProps {
  images: string[];
  restaurantTitle: string;
}

export default function ImageGallery({ images, restaurantTitle }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  if (!images.length) {
    return (
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-t-2xl overflow-hidden bg-gray-200">
        <div className="flex items-center justify-center h-full text-gray-500">
          <span>No images available</span>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="relative group w-full h-full">
        {/* Main Image */}
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={images[selectedImage]}
            alt={`${restaurantTitle} - Image ${selectedImage + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImage + 1} / {images.length}
            </div>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedImage ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Show All Photos Button */}
          {images.length > 1 && (
            <button
              onClick={() => setShowAllImages(true)}
              className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/70 transition-colors"
            >
              Show all photos ({images.length})
            </button>
          )}
        </div>
      </div>

      {/* Full Screen Gallery Modal */}
      {showAllImages && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowAllImages(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative w-full h-full max-w-7xl max-h-full">
              <Image
                src={images[selectedImage]}
                alt={`${restaurantTitle} - Image ${selectedImage + 1}`}
                fill
                className="object-contain"
              />
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <FiChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <FiChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      index === selectedImage ? "border-white" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Counter */}
            <div className="absolute top-4 left-4 text-white text-lg font-medium">
              {selectedImage + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
