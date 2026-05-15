import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CursorGlow from '@/components/CursorGlow';
import { AuthProvider } from '@/lib/authContext';
import { ClientAuthProvider } from '@/lib/clientAuthContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://hallofmirrorstattoo.com'),
  title: 'Hall of Mirrors Tattoo Studio — Liverpool',
  description: 'Bespoke tattoo artistry in Liverpool. Neo-traditional specialist Robyn creates timeless, meticulously crafted work. Book your appointment or free consultation.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com',
  },
  openGraph: {
    title: 'Hall of Mirrors Tattoo Studio',
    description: 'Bespoke tattoo artistry in Liverpool. Neo-traditional specialist. Every design custom.',
    url: 'https://hallofmirrorstattoo.com',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hall of Mirrors Tattoo Studio — Liverpool',
    description: 'Bespoke tattoo artistry in Liverpool. Neo-traditional specialist. Every design custom.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <ClientAuthProvider>
            <CursorGlow />
            <Header />
            <main className="min-h-screen pt-24 md:pt-32">
              {children}
            </main>
            <Footer />
          </ClientAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
