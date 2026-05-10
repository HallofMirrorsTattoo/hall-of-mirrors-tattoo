'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ShopCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photos] = useState<string[]>([
    '/assets/shop-carousel/IMG_1327.jpg',
    '/assets/shop-carousel/IMG_1328.jpg',
    '/assets/shop-carousel/IMG_1329.jpg',
    '/assets/shop-carousel/IMG_1330.jpg',
    '/assets/shop-carousel/IMG_1331.jpg',
  ]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#2a2a2a]">
      {/* Photos Container */}
      {photos.map((photo, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={photo}
            alt={`Hall of Mirrors shop interior - photo ${index + 1}`}
            fill
            className="object-cover"
            priority={index === currentIndex}
            quality={85}
          />
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-accent-gold/80 hover:bg-accent-gold p-2 rounded-full transition-colors duration-300 hover:scale-110 active:scale-95"
        aria-label="Previous photo"
      >
        <ChevronLeft className="w-6 h-6 text-primary-dark" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-accent-gold/80 hover:bg-accent-gold p-2 rounded-full transition-colors duration-300 hover:scale-110 active:scale-95"
        aria-label="Next photo"
      >
        <ChevronRight className="w-6 h-6 text-primary-dark" />
      </button>

      {/* Carousel counter/indicator dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-accent-gold w-8' : 'bg-accent-gold/40'
            }`}
            aria-label={`Go to photo ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
