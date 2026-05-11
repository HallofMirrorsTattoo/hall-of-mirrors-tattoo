'use client';

import { useState, useEffect } from 'react';

export default function ScrollGradientFade() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const onScroll = () => {
      const fade = Math.max(0, 1 - window.scrollY / 280);
      setOpacity(fade);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
      style={{
        height: '180px',
        background: 'linear-gradient(to bottom, transparent, #0E0C09)',
        opacity,
        transition: 'opacity 0.1s linear',
      }}
    />
  );
}
