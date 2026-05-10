'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const photos = [
  '/assets/shop-carousel/IMG_1327.jpg',
  '/assets/shop-carousel/IMG_1328.jpg',
  '/assets/shop-carousel/IMG_1329.jpg',
  '/assets/shop-carousel/IMG_1330.jpg',
  '/assets/shop-carousel/IMG_1331.jpg',
];

export default function ShopCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#2a2a2a]">
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
            priority={index === 0}
            quality={85}
          />
        </div>
      ))}

      {/* Indicator dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {photos.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-accent-gold w-8' : 'bg-accent-gold/40 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
