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
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrev(current);
      setCurrent((c) => (c + 1) % photos.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [current]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {photos.map((photo, i) => (
        <div
          key={photo}
          className="absolute inset-0"
          style={{
            zIndex: i === current ? 2 : i === prev ? 1 : 0,
            opacity: i === current ? 1 : 0,
            transition: i === current
              ? 'opacity 1.4s cubic-bezier(0.4,0,0.2,1)'
              : i === prev
              ? 'opacity 1.4s cubic-bezier(0.4,0,0.2,1)'
              : 'none',
          }}
        >
          <Image
            src={photo}
            alt={`Hall of Mirrors studio — view ${i + 1}`}
            fill
            className="object-cover"
            style={{
              animation: i === current ? 'kenBurns 8s ease-out forwards' : 'none',
              transformOrigin: 'center center',
            }}
            priority={i === 0}
            quality={90}
          />
          {/* Per-image dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(14, 12, 9,0.45) 0%, rgba(14, 12, 9,0.2) 40%, rgba(14, 12, 9,0.55) 100%)',
            }}
          />
        </div>
      ))}

      {/* Deep bottom gradient into page bg */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '55%',
          background: 'linear-gradient(to bottom, transparent, #0E0C09)',
          zIndex: 10,
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(14, 12, 9,0.6), transparent)',
          zIndex: 10,
        }}
      />
    </div>
  );
}
