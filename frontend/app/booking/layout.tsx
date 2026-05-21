import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Tattoo Appointment | Hall of Mirrors Liverpool',
  description: 'Book your tattoo appointment at Hall of Mirrors, Castle Street Liverpool. Bespoke neo-traditional tattoos, cover-ups, and free consultations. Appointment-only, limited availability.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/booking',
  },
  openGraph: {
    title: 'Book a Tattoo Appointment | Hall of Mirrors Liverpool',
    description: 'Book your tattoo at Hall of Mirrors, Castle Street Liverpool. Bespoke neo-traditional tattooing, cover-ups, and free consultations. Limited availability.',
    url: 'https://hallofmirrorstattoo.com/booking',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Tattoo Appointment | Hall of Mirrors Liverpool',
    description: 'Book your tattoo at Hall of Mirrors, Castle Street Liverpool. Bespoke neo-traditional tattooing from £150. Limited availability.',
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
