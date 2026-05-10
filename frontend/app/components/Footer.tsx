import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary-darker border-t border-accent-gold/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Studio Info */}
          <div>
            <h3 className="text-xl font-serif text-accent-gold mb-4">Hall of Mirrors</h3>
            <p className="text-white/70 text-sm">
              Suite 3, 34 Castle Street<br />
              Liverpool L2 0NR<br />
              United Kingdom
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-accent-gold font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/booking" className="text-white/70 hover:text-accent-gold transition">Book Appointment</Link></li>
              <li><Link href="/services" className="text-white/70 hover:text-accent-gold transition">Pricing</Link></li>
              <li><Link href="/aftercare" className="text-white/70 hover:text-accent-gold transition">Aftercare</Link></li>
              <li><Link href="/consultation" className="text-white/70 hover:text-accent-gold transition">Consultation</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-accent-gold font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-white/70 hover:text-accent-gold transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-white/70 hover:text-accent-gold transition">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="text-white/70 hover:text-accent-gold transition">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-accent-gold/20 pt-8 flex justify-between items-center flex-col md:flex-row gap-4">
          <p className="text-white/50 text-sm">
            &copy; 2026 Hall of Mirrors Tattoo. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/50 hover:text-accent-gold transition">Instagram</a>
            <a href="#" className="text-white/50 hover:text-accent-gold transition">TikTok</a>
            <a href="#" className="text-white/50 hover:text-accent-gold transition">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
