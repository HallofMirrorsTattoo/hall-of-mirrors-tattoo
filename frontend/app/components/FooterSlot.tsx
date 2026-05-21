'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function FooterSlot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (
    pathname.startsWith('/client/dashboard') ||
    pathname.startsWith('/artist/dashboard')
  ) {
    return null;
  }
  return <>{children}</>;
}
