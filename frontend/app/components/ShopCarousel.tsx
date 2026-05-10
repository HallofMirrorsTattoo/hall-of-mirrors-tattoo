'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ShopCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photos] = useState<string[]>([
    '/assets/shop-carousel/IMG_1327.jpg',
    '/assets/shop-carousel/IMG_1328.jpg',
    '/assets/shop-carousel/IMG_1329.jpg',
    '/assets/shop-carousel/IMG_1330.jpg',
    '/assets/shop-carousel/IMG_1331.jpg',
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [photos.length]);

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

      {/* Carousel indicator dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
        {photos.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-accent-gold w-8' : 'bg-accent-gold/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
