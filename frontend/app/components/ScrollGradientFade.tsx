'use client';

import { useState, useEffect } from 'react';

export default function ScrollGradientFade() {
  const [gradientOpacity, setGradientOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate how far down the page the user has scrolled
      // Fade starts fully opaque at top, becomes transparent after scrolling ~300px
      const scrollY = window.scrollY;
      const fadeStart = 0;
      const fadeEnd = 300;

      // Calculate opacity: starts at 1, goes to 0 as user scrolls
      const opacity = Math.max(0, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
      setGradientOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#2a2a2a] pointer-events-none z-10 transition-opacity duration-300"
      style={{ opacity: gradientOpacity }}
    />
  );
}
