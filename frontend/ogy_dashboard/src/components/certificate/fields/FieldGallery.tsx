import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import CanisterImage from "../CanisterImage";
import { FileReference } from "../types";
import { FieldProps } from "./FieldProps";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

const isVideoPath = (path: string): boolean => {
  if (!path) return false;
  const lowerPath = path.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
};

interface MediaItem {
  id: string;
  path: string;
  isVideo: boolean;
}

const FieldGallery = ({ data }: FieldProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const files = (data as FileReference[]) ?? [];

  const mediaItems: MediaItem[] = files.map((file) => ({
    id: file.id,
    path: file.path,
    isVideo: isVideoPath(file.path),
  }));

  if (mediaItems.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const currentMedia =
    mediaItems[Math.min(currentIndex, mediaItems.length - 1)];
  const mediaUrl = currentMedia.path;

  return (
    <div className="mt-8 w-full">
      <div className="relative mx-auto max-w-[1024px]">
        <div
          className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg bg-gray-100"
          onClick={() => !currentMedia.isVideo && setIsModalOpen(true)}
        >
          {currentMedia.isVideo ? (
            <video
              key={mediaUrl}
              controls
              className="h-full w-full object-contain"
              src={mediaUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <CanisterImage
              src={mediaUrl}
              alt={`Gallery item ${currentIndex + 1}`}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {mediaItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
              aria-label="Previous item"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
              aria-label="Next item"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        {mediaItems.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-gray-800" : "bg-gray-300"
                }`}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {mediaItems.length > 1 && (
        <div className="mx-auto mt-4 flex max-w-[1024px] gap-2 overflow-x-auto pb-2">
          {mediaItems.map((media, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                index === currentIndex
                  ? "border-gray-800"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              {media.isVideo ? (
                <>
                  <video
                    src={media.path}
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <PlayCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </>
              ) : (
                <CanisterImage
                  src={media.path}
                  alt={`Thumbnail ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {isModalOpen && !currentMedia.isVideo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white transition-colors hover:text-gray-300"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          <CanisterImage
            src={mediaUrl}
            alt={`Gallery item ${currentIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute top-1/2 left-4 -translate-y-1/2 p-2 text-white transition-colors hover:text-gray-300"
                aria-label="Previous item"
              >
                <ChevronLeftIcon className="h-10 w-10" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute top-1/2 right-4 -translate-y-1/2 p-2 text-white transition-colors hover:text-gray-300"
                aria-label="Next item"
              >
                <ChevronRightIcon className="h-10 w-10" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white">
            {currentIndex + 1} / {mediaItems.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldGallery;
