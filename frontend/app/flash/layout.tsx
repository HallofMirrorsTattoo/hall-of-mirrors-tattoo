import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Days | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'Flash day events at Hall of Mirrors Tattoo Studio, Liverpool. Pre-drawn original designs at fixed prices — available for one day only. Castle Street, Liverpool city centre.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/flash',
  },
  openGraph: {
    title: 'Flash Days | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Pre-drawn original tattoo designs at fixed prices. Available for one day only at Hall of Mirrors, Castle Street Liverpool. Claim yours before they\'re gone.',
    url: 'https://hallofmirrorstattoo.com/flash',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flash Days | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Pre-drawn original tattoo designs at fixed prices. One day only at Hall of Mirrors, Liverpool.',
  },
};

export default function FlashLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
