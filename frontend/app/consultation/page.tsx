'use client';

import { useState } from 'react';

export default function Consultation() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glassmorphism p-12 text-center">
          <h2 className="text-3xl font-serif text-accent-gold mb-4">Consultation Request Received</h2>
          <p className="text-white/80">
            Thank you! Robyn will contact you within 48 hours to discuss your tattoo idea.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif text-accent-gold mb-4">Free Consultation</h1>
      <p className="text-white/70 mb-12">
        Not ready to book yet? Request a free consultation to discuss your tattoo idea with Robyn.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name">Full Name *</label>
          <input type="text" id="name" name="name" required placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email">Email *</label>
          <input type="email" id="email" name="email" required placeholder="your@email.com" />
        </div>
        <div>
          <label htmlFor="phone">Phone *</label>
          <input type="tel" id="phone" name="phone" required placeholder="+44 (0) 123 456 7890" />
        </div>
        <div>
          <label htmlFor="tattoo_idea">Tattoo Idea *</label>
          <textarea
            id="tattoo_idea"
            name="tattoo_idea"
            rows={5}
            required
            placeholder="Describe your tattoo idea, style preferences, and any reference images"
          />
        </div>
        <div>
          <label htmlFor="timeframe">Preferred Timeframe *</label>
          <select id="timeframe" name="timeframe" required>
            <option value="">Select timeframe</option>
            <option value="asap">ASAP</option>
            <option value="1month">Within 1 month</option>
            <option value="2months">Within 2 months</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full">
          Request Consultation
        </button>
      </form>
    </div>
  );
}
