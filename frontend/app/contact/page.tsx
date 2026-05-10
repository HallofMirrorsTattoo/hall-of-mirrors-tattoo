'use client';

import { useState } from 'react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif text-accent-gold mb-12">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-accent-gold mb-2">Studio Address</h3>
            <p className="text-white/70">
              Suite 3, 34 Castle Street<br />
              Liverpool L2 0NR<br />
              United Kingdom
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-accent-gold mb-2">Hours</h3>
            <p className="text-white/70">
              Monday - Sunday<br />
              9:00 AM - 8:00 PM<br />
              (Appointments by booking only)
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-accent-gold mb-2">Contact</h3>
            <p className="text-white/70">
              Phone: +44 (0) XXX XXX XXXX<br />
              Email: contact@hallofmirrors.tattoo
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-accent-gold mb-2">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="text-accent-gold hover:text-white transition">Instagram</a>
              <a href="#" className="text-accent-gold hover:text-white transition">TikTok</a>
              <a href="#" className="text-accent-gold hover:text-white transition">Facebook</a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          {submitted ? (
            <div className="glassmorphism p-6 text-center">
              <h3 className="text-xl font-serif text-accent-gold mb-2">Message Sent</h3>
              <p className="text-white/80">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name">Name *</label>
                <input type="text" id="name" name="name" required placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" name="email" required placeholder="your@email.com" />
              </div>
              <div>
                <label htmlFor="subject">Subject *</label>
                <input type="text" id="subject" name="subject" required placeholder="How can we help?" />
              </div>
              <div>
                <label htmlFor="message">Message *</label>
                <textarea id="message" name="message" rows={5} required placeholder="Your message..." />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
