'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const photos = [
  { src: '/assets/shop-carousel/IMG_1404.PNG', alt: 'Hall of Mirrors studio — view 1', animation: 'kenBurns1' },
  { src: '/assets/shop-carousel/IMG_1405.PNG', alt: 'Hall of Mirrors studio — view 2', animation: 'kenBurns2' },
  { src: '/assets/shop-carousel/IMG_1406.PNG', alt: 'Hall of Mirrors studio — view 3', animation: 'kenBurns3' },
  { src: '/assets/shop-carousel/IMG_1407.PNG', alt: 'Hall of Mirrors studio — view 4', animation: 'kenBurns4' },
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
      {photos.map(({ src, alt, animation }, i) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{
            zIndex: i === current ? 2 : i === prev ? 1 : 0,
            opacity: i === current ? 1 : 0,
            transition: i === current || i === prev
              ? 'opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            style={{
              animation: i === current ? `${animation} 9s ease-in-out forwards` : 'none',
            }}
            priority={i === 0}
            quality={90}
          />
          {/* Atmospheric per-image overlay — top+bottom darken + side vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                'linear-gradient(to bottom, rgba(14,12,9,0.38) 0%, rgba(14,12,9,0.06) 40%, rgba(14,12,9,0.32) 100%)',
                'linear-gradient(to right, rgba(14,12,9,0.16) 0%, transparent 22%, transparent 78%, rgba(14,12,9,0.16) 100%)',
              ].join(', '),
            }}
          />
        </div>
      ))}

      {/* Smooth multi-stop bottom fade into page bg */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '60%',
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(14,12,9,0.05) 12%, rgba(14,12,9,0.16) 26%, rgba(14,12,9,0.36) 42%, rgba(14,12,9,0.62) 58%, rgba(14,12,9,0.83) 74%, rgba(14,12,9,0.95) 87%, #0E0C09 100%)',
          zIndex: 10,
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '25%',
          background: 'linear-gradient(to bottom, rgba(14,12,9,0.55) 0%, rgba(14,12,9,0.14) 60%, transparent 100%)',
          zIndex: 10,
        }}
      />
    </div>
  );
}
