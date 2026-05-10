import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/authContext';

export const metadata: Metadata = {
  title: 'Hall of Mirrors Tattoo - Liverpool',
  description: 'Professional tattoo studio in Liverpool. Book your appointment with Robyn.',
  openGraph: {
    title: 'Hall of Mirrors Tattoo',
    description: 'Professional tattoo studio in Liverpool.',
    url: 'https://hallofmirrors.tattoo',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Garamond:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Header />
          <main className="min-h-screen pt-24 md:pt-32">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
