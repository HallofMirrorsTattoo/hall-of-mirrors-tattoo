import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Free Consultation | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'Book a free tattoo consultation at Hall of Mirrors, Castle Street Liverpool. Discuss your idea, placement, and design process with our neo-traditional specialist. No obligation.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/consultation',
  },
  openGraph: {
    title: 'Book a Free Tattoo Consultation | Hall of Mirrors Liverpool',
    description: 'Free tattoo consultation at Hall of Mirrors, Castle Street Liverpool. Talk through your idea with a neo-traditional specialist. No commitment required.',
    url: 'https://hallofmirrorstattoo.com/consultation',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Free Tattoo Consultation | Hall of Mirrors Liverpool',
    description: 'Free tattoo consultation at Hall of Mirrors, Castle Street Liverpool. No obligation. Talk through your idea with a specialist.',
  },
};

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
