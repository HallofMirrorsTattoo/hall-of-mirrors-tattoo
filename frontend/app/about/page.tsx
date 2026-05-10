import Link from 'next/link';

export default function About() {
  const credentials = [
    { label: 'Liverpool City Council Registered', detail: 'Ref: A11394900' },
    { label: 'Hepatitis B Vaccinated', detail: 'Full health & safety compliance' },
    { label: 'Autoclave Certified', detail: 'Professional sterilisation standards' },
    { label: 'GDPR Compliant', detail: 'Your data handled with care' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: '#2a2a2a' }}>
      <div className="max-w-5xl mx-auto space-y-16">

        {/* Header */}
        <div className="space-y-4">
          <span className="eyebrow">The Artist</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light">
            Meet Robyn
          </h1>
          <p className="text-primary-light/70 max-w-2xl text-lg">
            Neo-traditional specialist based at Hall of Mirrors Tattoo Studio,
            34 Castle Street, Liverpool.
          </p>
        </div>

        {/* Bio + Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-premium">
            <div className="card-premium-inner space-y-4">
              <h2 className="text-xl font-serif font-semibold text-primary-light">About</h2>
              <p className="text-primary-light/70 leading-relaxed">
                Robyn's bio will be added here — her background, style, inspirations,
                and what makes her work unique.
              </p>
              <p className="text-primary-light/70 leading-relaxed">
                Specialising in neo-traditional tattooing with a passion for bold colour,
                fine line detail, and bespoke designs tailored to each client.
              </p>
              <div className="pt-2">
                <Link href="/portfolio" className="btn-secondary">
                  View Portfolio
                </Link>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <div className="card-premium-inner space-y-4">
              <h2 className="text-xl font-serif font-semibold text-primary-light">
                Studio Credentials
              </h2>
              <ul className="space-y-4">
                {credentials.map((c) => (
                  <li key={c.label} className="flex gap-3">
                    <span className="text-accent-gold font-bold mt-0.5">✓</span>
                    <div>
                      <p className="text-primary-light font-medium text-sm">{c.label}</p>
                      <p className="text-primary-light/50 text-xs">{c.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Studio Info */}
        <div className="card-premium">
          <div className="card-premium-inner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <p className="text-accent-gold text-3xl font-serif font-bold">Liverpool</p>
                <p className="text-primary-light/60 text-sm">Suite 3, 34 Castle Street, L2 0NR</p>
              </div>
              <div className="space-y-2">
                <p className="text-accent-gold text-3xl font-serif font-bold">Bespoke</p>
                <p className="text-primary-light/60 text-sm">Every design is created for you</p>
              </div>
              <div className="space-y-2">
                <p className="text-accent-gold text-3xl font-serif font-bold">Consultation</p>
                <p className="text-primary-light/60 text-sm">Free initial design consultations</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/booking" className="btn-primary group">
            <span>Book Appointment</span>
            <div className="btn-primary-icon">↗</div>
          </Link>
          <Link href="/consultation" className="btn-secondary">
            Free Consultation
          </Link>
        </div>

      </div>
    </div>
  );
}
