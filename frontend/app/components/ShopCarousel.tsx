'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const BURNS = ['kenBurns1', 'kenBurns2', 'kenBurns3', 'kenBurns4'] as const;

// Expo-out for the incoming slide: snaps to attention quickly, then settles.
// Quartic ease-in for the outgoing slide: holds presence, then releases gracefully.
const TRANSITION_IN  = 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
const TRANSITION_OUT = 'opacity 2.2s cubic-bezier(0.895, 0.03, 0.685, 0.22)';

interface CarouselPhoto { src: string; alt: string; }

export default function ShopCarousel({ photos }: { photos: CarouselPhoto[] }) {
  const slides = photos.map((p, i) => ({ ...p, animation: BURNS[i % 4] }));
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrev(current);
      setCurrent((c) => (c + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [current, slides.length]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {slides.map(({ src, alt, animation }, i) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{
            zIndex: i === current ? 2 : i === prev ? 1 : 0,
            opacity: i === current ? 1 : 0,
            transition: i === current ? TRANSITION_IN : i === prev ? TRANSITION_OUT : 'none',
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            className="object-cover"
            style={{
              animation: (i === current || i === prev) ? `${animation} 9s cubic-bezier(0,0,0.2,1) forwards` : 'none',
              filter: 'brightness(0.87) contrast(1.06) saturate(0.72) sepia(0.08)',
            }}
            priority={i === 0}
            quality={85}
          />
          {/* Per-image atmospheric overlay: vertical darken + side vignette */}
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

      {/* Warm ambient glow — pulls the obsidian fade toward the brand gold at candlelight intensity */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '45%',
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,168,76,0.055) 0%, transparent 70%)',
          zIndex: 9,
        }}
      />

      {/* Smooth 8-stop bottom fade into page bg */}
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
