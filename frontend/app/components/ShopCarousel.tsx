'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ShopCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load photos from public folder
  useEffect(() => {
    // Hardcode the shop carousel photos that exist in the folder
    const photoNames = [
      '/assets/shop-carousel/IMG_1327.jpg',
      '/assets/shop-carousel/IMG_1328.jpg',
      '/assets/shop-carousel/IMG_1329.jpg',
      '/assets/shop-carousel/IMG_1330.jpg',
      '/assets/shop-carousel/IMG_1331.jpg',
    ];

    setPhotos(photoNames);
    setLoading(false);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-primary-dark border-2 border-primary-light flex items-center justify-center">
        <div className="text-primary-light">Loading carousel...</div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Carousel Container */}
      <div className="relative w-full h-96 md:h-[500px] overflow-hidden bg-primary-dark border-2 border-primary-light">
        {/* Photos Wrapper - Shows current photo centered with peek of adjacent ones */}
        <div className="relative w-full h-full">
          {photos.map((photo, index) => {
            const isVisible = index === currentIndex;
            const isPrev = index === (currentIndex - 1 + photos.length) % photos.length;
            const isNext = index === (currentIndex + 1) % photos.length;

            return (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  isVisible ? 'opacity-100 translate-x-0 z-10' : isPrev ? 'opacity-60 -translate-x-[80%] z-5' : isNext ? 'opacity-60 translate-x-[80%] z-5' : 'opacity-0 z-0'
                }`}
              >
                <Image
                  src={photo}
                  alt={`Hall of Mirrors shop interior - photo ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === currentIndex}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-accent-gold/80 hover:bg-accent-gold p-2 rounded-full transition-colors duration-300"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-6 h-6 text-primary-dark" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-accent-gold/80 hover:bg-accent-gold p-2 rounded-full transition-colors duration-300"
          aria-label="Next photo"
        >
          <ChevronRight className="w-6 h-6 text-primary-dark" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-accent-gold w-8' : 'bg-primary-light/50 hover:bg-primary-light'
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Photo Counter */}
      <div className="text-center mt-4 text-primary-light/70 text-sm">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
