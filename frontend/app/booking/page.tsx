'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Booking() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    tattooDescription: '',
    placement: '',
    size: 'medium',
    consent: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Booking submitted:', formData);
    alert('Booking submitted! You will receive a confirmation email shortly.');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif text-accent-gold mb-2">Book Your Appointment</h1>
      <p className="text-white/70 mb-12">Step {step} of 4</p>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="phone">Phone *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+44 (0) 123 456 7890"
              />
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="date">Preferred Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="time">Preferred Time *</label>
              <select
                id="time"
                name="time"
                required
                value={formData.time}
                onChange={handleInputChange}
              >
                <option value="">Select a time</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
              </select>
            </div>
            <p className="text-white/70 text-sm">Final availability confirmed after submission</p>
          </div>
        )}

        {/* Step 3: Tattoo Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="tattooDescription">Tattoo Description *</label>
              <textarea
                id="tattooDescription"
                name="tattooDescription"
                required
                rows={4}
                value={formData.tattooDescription}
                onChange={handleInputChange}
                placeholder="Describe your tattoo idea, style, and any reference images you have"
              />
            </div>
            <div>
              <label htmlFor="placement">Placement *</label>
              <input
                type="text"
                id="placement"
                name="placement"
                required
                value={formData.placement}
                onChange={handleInputChange}
                placeholder="e.g., Arm, Chest, Leg, Back"
              />
            </div>
            <div>
              <label htmlFor="size">Estimated Size *</label>
              <select
                id="size"
                name="size"
                required
                value={formData.size}
                onChange={handleInputChange}
              >
                <option value="small">Small (1-3")</option>
                <option value="medium">Medium (3-6")</option>
                <option value="large">Large (6"+)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Consent */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="glassmorphism p-6">
              <h3 className="text-lg font-semibold text-accent-gold mb-4">Consent Form</h3>
              <div className="text-white/80 text-sm space-y-4 mb-6 max-h-64 overflow-y-auto">
                <p><strong>Age Confirmation:</strong> I confirm I am 18 years or older.</p>
                <p><strong>Health:</strong> I have disclosed all relevant medical information accurately.</p>
                <p><strong>Risks:</strong> I understand the risks associated with tattooing and accept them.</p>
                <p><strong>Sobriety:</strong> I confirm I have not consumed alcohol or drugs in the last 24 hours.</p>
                <p><strong>Suitability:</strong> I am in good health and suitable for tattooing.</p>
                <p><strong>Voluntary:</strong> I am entering into this agreement voluntarily.</p>
                <p><strong>Aftercare:</strong> I accept responsibility for proper aftercare.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <span className="text-white/80 text-sm">I agree to the consent form and studio policies</span>
              </label>
              {!formData.consent && (
                <p className="text-rust text-sm mt-2">You must accept the consent form to proceed</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 flex gap-4 justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!formData.consent}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Booking
            </button>
          )}
        </div>
      </form>

      <div className="mt-12 text-center text-white/70 text-sm">
        <p>Need help? <Link href="/consultation" className="text-accent-gold hover:text-white">Request a free consultation</Link></p>
      </div>
    </div>
  );
}
