'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  threshold?: number;
}

export default function AnimatedSection({
  children,
  className = '',
  style,
  delay = 0,
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
