import Link from 'next/link';
import Image from 'next/image';
import LogoText from './LogoText';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20 section-dark">
      <div className="max-w-6xl mx-auto px-4 py-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/logos/HOMLOGO.png"
                alt="Hall of Mirrors"
                width={50}
                height={50}
                className="w-12 h-12 object-contain"
              />
              <LogoText size="sm" className="h-10" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Bespoke tattoo artistry in Liverpool. Crafting timeless designs with meticulous precision.
            </p>
          </div>

          {/* Studio */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Studio</h4>
            <address className="text-white/60 text-sm leading-relaxed not-italic">
              Suite 3<br />
              34 Castle Street<br />
              Liverpool L2 0NR<br />
              United Kingdom
            </address>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Navigate</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/booking" className="text-white/60 hover:text-accent-gold transition-colors duration-300">Book Appointment</Link></li>
              <li><Link href="/portfolio" className="text-white/60 hover:text-accent-gold transition-colors duration-300">Portfolio</Link></li>
              <li><Link href="/services" className="text-white/60 hover:text-accent-gold transition-colors duration-300">Services</Link></li>
              <li><Link href="/consultation" className="text-white/60 hover:text-accent-gold transition-colors duration-300">Consultation</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-white/60 hover:text-accent-gold transition-colors duration-300">Terms</Link></li>
              <li><Link href="/privacy" className="text-white/60 hover:text-accent-gold transition-colors duration-300">Privacy</Link></li>
              <li><Link href="/aftercare" className="text-white/60 hover:text-accent-gold transition-colors duration-300">Aftercare</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex justify-between items-center flex-col md:flex-row gap-8">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Hall of Mirrors. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/40 hover:text-accent-gold transition-colors duration-300 text-sm font-medium">Instagram</a>
            <a href="#" className="text-white/40 hover:text-accent-gold transition-colors duration-300 text-sm font-medium">TikTok</a>
            <a href="#" className="text-white/40 hover:text-accent-gold transition-colors duration-300 text-sm font-medium">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
