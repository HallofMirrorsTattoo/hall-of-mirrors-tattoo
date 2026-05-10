'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-primary-dark border-b border-accent-gold/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-serif text-accent-gold font-bold">
            Hall of Mirrors
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex gap-8">
            <li><Link href="/" className="hover:text-accent-gold transition">Home</Link></li>
            <li><Link href="/portfolio" className="hover:text-accent-gold transition">Portfolio</Link></li>
            <li><Link href="/services" className="hover:text-accent-gold transition">Services</Link></li>
            <li><Link href="/about" className="hover:text-accent-gold transition">About</Link></li>
            <li><Link href="/testimonials" className="hover:text-accent-gold transition">Reviews</Link></li>
            <li><Link href="/contact" className="hover:text-accent-gold transition">Contact</Link></li>
          </ul>

          {/* CTA Button */}
          <Link href="/booking" className="hidden md:block btn-primary">
            Book Now
          </Link>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <ul className="md:hidden mt-4 space-y-2">
            <li><Link href="/" className="block hover:text-accent-gold transition">Home</Link></li>
            <li><Link href="/portfolio" className="block hover:text-accent-gold transition">Portfolio</Link></li>
            <li><Link href="/services" className="block hover:text-accent-gold transition">Services</Link></li>
            <li><Link href="/about" className="block hover:text-accent-gold transition">About</Link></li>
            <li><Link href="/testimonials" className="block hover:text-accent-gold transition">Reviews</Link></li>
            <li><Link href="/contact" className="block hover:text-accent-gold transition">Contact</Link></li>
            <li><Link href="/booking" className="block btn-primary mt-4">Book Now</Link></li>
          </ul>
        )}
      </nav>
    </header>
  );
}
