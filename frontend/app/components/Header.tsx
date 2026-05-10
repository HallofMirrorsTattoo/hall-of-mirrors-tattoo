'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-40 pt-6 px-4">
      {/* Floating nav pill */}
      <nav className="max-w-5xl mx-auto glassmorphism rounded-full p-1.5">
        <div className="flex justify-between items-center px-4 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity duration-300">
            <Image
              src="/assets/logos/HOMLOGO.png"
              alt="Hall of Mirrors"
              width={50}
              height={50}
              priority
              className="w-12 h-12 md:w-14 md:h-14 object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex gap-8 flex-1 justify-center">
            <li><Link href="/" className="text-sm font-medium text-white/70 hover:text-accent-gold transition-colors duration-300">Home</Link></li>
            <li><Link href="/portfolio" className="text-sm font-medium text-white/70 hover:text-accent-gold transition-colors duration-300">Portfolio</Link></li>
            <li><Link href="/services" className="text-sm font-medium text-white/70 hover:text-accent-gold transition-colors duration-300">Services</Link></li>
            <li><Link href="/about" className="text-sm font-medium text-white/70 hover:text-accent-gold transition-colors duration-300">About</Link></li>
            <li><Link href="/contact" className="text-sm font-medium text-white/70 hover:text-accent-gold transition-colors duration-300">Contact</Link></li>
          </ul>

          {/* CTA Button */}
          <Link href="/booking" className="hidden md:flex btn-primary">
            <span>Book</span>
            <div className="btn-primary-icon">
              →
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative w-6 h-6 flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className={`w-6 h-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] absolute ${isOpen ? 'opacity-0 rotate-90' : 'opacity-100'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              className={`w-6 h-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] absolute ${!isOpen ? 'opacity-0 -rotate-90' : 'opacity-100'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-24 md:hidden z-30">
          <div className="glassmorphism m-4 rounded-3xl p-8 space-y-6 backdrop-blur-3xl">
            <ul className="space-y-4">
              <li><Link href="/" className="block text-lg font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setIsOpen(false)}>Home</Link></li>
              <li><Link href="/portfolio" className="block text-lg font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setIsOpen(false)}>Portfolio</Link></li>
              <li><Link href="/services" className="block text-lg font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setIsOpen(false)}>Services</Link></li>
              <li><Link href="/about" className="block text-lg font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setIsOpen(false)}>About</Link></li>
              <li><Link href="/contact" className="block text-lg font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setIsOpen(false)}>Contact</Link></li>
            </ul>
            <Link href="/booking" className="btn-primary w-full flex justify-center" onClick={() => setIsOpen(false)}>
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
