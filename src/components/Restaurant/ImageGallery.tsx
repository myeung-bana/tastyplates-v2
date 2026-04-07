"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  restaurantTitle: string;
}

const HERO_HEIGHT =
  "min-h-[260px] h-[clamp(260px,36vw,440px)] max-h-[min(50vh,480px)]";

function GalleryTile({
  src,
  alt,
  index,
  onOpen,
  className,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  index: number;
  onOpen: (i: number) => void;
  className?: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={cn(
        "relative min-h-0 overflow-hidden rounded-xl bg-gray-200 text-left ring-1 ring-black/5 transition hover:ring-2 hover:ring-[#ff7c0a]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7c0a]",
        className
      )}
      aria-label={alt}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition duration-300 hover:scale-[1.02]"
        sizes={sizes}
        priority={priority}
      />
    </button>
  );
}

/**
 * Desktop hero: max 3 columns — main (left) | H + (V1|V2) (middle) | vertical R (right).
 * Images map: 0=main, 1=H, 2=V1, 3=V2, 4=R; index ≥5 continues in a 3-col row below.
 */
function DesktopHeroGrid({
  images,
  restaurantTitle,
  onOpen,
}: {
  images: string[];
  restaurantTitle: string;
  onOpen: (index: number) => void;
}) {
  const n = images.length;
  const sizesMain = "(min-width: 768px) 45vw, 100vw";
  const sizesMid = "(min-width: 768px) 22vw, 50vw";
  const sizesRight = "(min-width: 768px) 18vw, 33vw";
  const sizesExtra = "(min-width: 768px) 28vw, 33vw";

  const alt = (i: number) => `${restaurantTitle} - Photo ${i + 1}`;

  if (n === 1) {
    return (
      <div className={cn("w-full", HERO_HEIGHT)}>
        <GalleryTile
          src={images[0]}
          alt={alt(0)}
          index={0}
          onOpen={onOpen}
          className="h-full w-full min-h-[200px]"
          priority
          sizes={sizesMain}
        />
      </div>
    );
  }

  if (n === 2) {
    return (
      <div className={cn("grid w-full grid-cols-2 gap-2 md:gap-3", HERO_HEIGHT)}>
        <GalleryTile
          src={images[0]}
          alt={alt(0)}
          index={0}
          onOpen={onOpen}
          className="min-h-0"
          priority
          sizes={sizesMain}
        />
        <GalleryTile
          src={images[1]}
          alt={alt(1)}
          index={1}
          onOpen={onOpen}
          className="min-h-0"
          sizes={sizesMain}
        />
      </div>
    );
  }

  if (n === 3) {
    return (
      <div
        className={cn(
          "grid w-full grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-2 md:gap-3",
          HERO_HEIGHT
        )}
      >
        <GalleryTile
          src={images[0]}
          alt={alt(0)}
          index={0}
          onOpen={onOpen}
          className="row-span-2 min-h-0"
          priority
          sizes={sizesMain}
        />
        <div className="grid min-h-0 grid-rows-2 gap-2 md:gap-3">
          <GalleryTile
            src={images[1]}
            alt={alt(1)}
            index={1}
            onOpen={onOpen}
            className="min-h-0 aspect-[16/9]"
            sizes={sizesMid}
          />
          <GalleryTile
            src={images[2]}
            alt={alt(2)}
            index={2}
            onOpen={onOpen}
            className="min-h-0"
            sizes={sizesMid}
          />
        </div>
      </div>
    );
  }

  if (n === 4) {
    return (
      <div
        className={cn(
          "grid w-full grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] grid-rows-2 gap-2 md:gap-3",
          HERO_HEIGHT
        )}
      >
        <GalleryTile
          src={images[0]}
          alt={alt(0)}
          index={0}
          onOpen={onOpen}
          className="row-span-2 col-start-1 min-h-0"
          priority
          sizes={sizesMain}
        />
        <GalleryTile
          src={images[1]}
          alt={alt(1)}
          index={1}
          onOpen={onOpen}
          className="row-start-1 col-start-2 min-h-0 aspect-[2/1]"
          sizes={sizesMid}
        />
        <div className="row-start-2 col-start-2 grid min-h-0 grid-cols-2 gap-2 md:gap-3">
          <GalleryTile
            src={images[2]}
            alt={alt(2)}
            index={2}
            onOpen={onOpen}
            className="min-h-0 aspect-[3/4]"
            sizes={sizesMid}
          />
          <GalleryTile
            src={images[3]}
            alt={alt(3)}
            index={3}
            onOpen={onOpen}
            className="min-h-0 aspect-[3/4]"
            sizes={sizesMid}
          />
        </div>
      </div>
    );
  }

  const rest = images.slice(5);

  return (
    <div className="flex w-full flex-col gap-2 md:gap-3">
      {/* 3 columns: main | H + V1/V2 | R */}
      <div
        className={cn(
          "grid w-full grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,0.82fr)] grid-rows-2 gap-2 md:gap-3",
          HERO_HEIGHT
        )}
      >
        <GalleryTile
          src={images[0]}
          alt={alt(0)}
          index={0}
          onOpen={onOpen}
          className="row-span-2 col-start-1 min-h-0"
          priority
          sizes={sizesMain}
        />

        <GalleryTile
          src={images[1]}
          alt={alt(1)}
          index={1}
          onOpen={onOpen}
          className="row-start-1 col-start-2 min-h-0 aspect-[2/1]"
          sizes={sizesMid}
        />

        <div className="row-start-2 col-start-2 grid min-h-0 grid-cols-2 gap-2 md:gap-3">
          <GalleryTile
            src={images[2]}
            alt={alt(2)}
            index={2}
            onOpen={onOpen}
            className="min-h-0 aspect-[3/4]"
            sizes={sizesMid}
          />
          <GalleryTile
            src={images[3]}
            alt={alt(3)}
            index={3}
            onOpen={onOpen}
            className="min-h-0 aspect-[3/4]"
            sizes={sizesMid}
          />
        </div>

        <GalleryTile
          src={images[4]}
          alt={alt(4)}
          index={4}
          onOpen={onOpen}
          className="row-span-2 col-start-3 h-full min-h-0"
          sizes={sizesRight}
        />
      </div>

      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {rest.map((src, j) => {
            const idx = j + 5;
            return (
              <GalleryTile
                key={`${src}-${idx}`}
                src={src}
                alt={alt(idx)}
                index={idx}
                onOpen={onOpen}
                className="aspect-[4/3]"
                sizes={sizesExtra}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ImageGallery({ images, restaurantTitle }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  if (!images.length) {
    return (
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-t-2xl overflow-hidden bg-gray-200">
        <div className="flex items-center justify-center h-full text-gray-500">
          <span className="text-center">No images available</span>
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

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setShowAllImages(true);
  };

  useEffect(() => {
    if (!showAllImages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAllImages(false);
      } else if (e.key === "ArrowLeft") {
        setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setSelectedImage((prev) => (prev + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAllImages, images.length]);

  const photosIcon = (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );

  const seeAllLabel =
    images.length > 1 ? `See all photos (${images.length})` : "View photo";

  return (
    <>
      {/* Mobile: single-image carousel + “See all photos” */}
      <div className="relative h-full min-h-[16rem] w-full font-neusans md:hidden">
        <div
          className="group relative h-full w-full cursor-pointer overflow-hidden"
          onClick={() => openLightbox(selectedImage)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLightbox(selectedImage);
            }
          }}
          aria-label={`Open photo gallery for ${restaurantTitle}`}
        >
          <Image
            src={images[selectedImage] || "/images/tastyplates_placeholder_landscape.jpg"}
            alt={`${restaurantTitle} - Image ${selectedImage + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            sizes="100vw"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 z-[1] -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-80 transition-opacity hover:opacity-100"
                aria-label="Previous image"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 z-[1] -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-80 transition-opacity hover:opacity-100"
                aria-label="Next image"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {selectedImage + 1} / {images.length}
            </div>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 gap-2 overflow-x-auto px-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                    index === selectedImage ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(selectedImage);
            }}
            className="absolute right-4 top-4 z-[2] flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2.5 text-[0.9375rem] font-normal shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          >
            {photosIcon}
            <span>{seeAllLabel}</span>
          </button>
        </div>
      </div>

      {/* Desktop: fixed 3-column hero + optional extra row (3 cols) */}
      <div className="relative hidden md:block">
        <div className="relative overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-black/5">
          <DesktopHeroGrid
            images={images}
            restaurantTitle={restaurantTitle}
            onOpen={openLightbox}
          />

          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2.5 font-neusans text-[0.9375rem] font-normal text-gray-900 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          >
            {photosIcon}
            <span>{seeAllLabel}</span>
          </button>
        </div>
      </div>

      {/* Full-screen lightbox */}
      {showAllImages && (
        <div
          className="fixed inset-0 z-[1001] bg-black transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllImages(false);
            }
          }}
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={() => setShowAllImages(false)}
              className="absolute left-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Close gallery"
            >
              <FiX className="h-6 w-6" />
            </button>

            <div
              className="relative h-full w-full max-h-full max-w-7xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedImage] || "/images/tastyplates_placeholder_landscape.jpg"}
                alt={`${restaurantTitle} - Image ${selectedImage + 1}`}
                fill
                className="object-contain"
                quality={95}
                sizes="100vw"
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                  aria-label="Next image"
                >
                  <FiChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {images.length > 1 && (
              <div
                className="absolute bottom-4 left-1/2 flex max-w-full -translate-x-1/2 space-x-2 overflow-x-auto px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors hover:border-white/50 ${
                      index === selectedImage ? "border-white" : "border-transparent"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="pointer-events-none absolute right-4 top-14 text-lg font-medium text-white md:top-4">
              {selectedImage + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
