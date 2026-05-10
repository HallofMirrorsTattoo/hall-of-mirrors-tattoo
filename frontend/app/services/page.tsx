import Link from 'next/link';

const services = [
  {
    name: 'Small Tattoo',
    size: '1–3"',
    desc: 'Simple designs and quick sessions. Perfect for first tattoos or additions to existing work.',
    price: '£150 – £250',
  },
  {
    name: 'Medium Tattoo',
    size: '3–6"',
    desc: 'Detail work, colour fills, and standard placement. Most popular session size.',
    price: '£300 – £500',
  },
  {
    name: 'Large Tattoo',
    size: '6"+ or multi-session',
    desc: 'Complex, fully custom designs. Price quoted after consultation based on detail and placement.',
    price: 'Custom Quote',
  },
  {
    name: 'Cover-Up',
    size: 'Varies',
    desc: 'Transform existing work into something you love. Requires an in-person consultation first.',
    price: 'Custom Quote',
  },
];

export default function Services() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: '#2a2a2a' }}>
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <span className="eyebrow">What&apos;s Included</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light">
            Services & Pricing
          </h1>
          <p className="text-primary-light/70 max-w-xl">
            All prices are starting points — final quotes depend on design complexity,
            size, and placement. Book a free consultation to get an accurate estimate.
          </p>
        </div>

        {/* Service cards */}
        <div className="space-y-4">
          {services.map((s) => (
            <div key={s.name} className="card-premium">
              <div className="card-premium-inner">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif font-semibold text-primary-light text-lg">{s.name}</h3>
                      <span className="text-xs text-accent-gold/70 font-medium border border-accent-gold/30 rounded-full px-2 py-0.5">
                        {s.size}
                      </span>
                    </div>
                    <p className="text-primary-light/60 text-sm">{s.desc}</p>
                  </div>
                  <div className="text-accent-gold font-serif font-bold text-xl md:text-right whitespace-nowrap">
                    {s.price}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deposit note */}
        <div className="card-premium">
          <div className="card-premium-inner space-y-2">
            <h3 className="font-serif font-semibold text-primary-light">Deposits</h3>
            <p className="text-primary-light/60 text-sm">
              A deposit is required to secure your booking. This is deducted from your final
              session price. Deposits are non-refundable if you cancel within 48 hours of your
              appointment.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/consultation" className="btn-primary group">
            <span>Free Consultation</span>
            <div className="btn-primary-icon">↗</div>
          </Link>
          <Link href="/booking" className="btn-secondary">
            Book Directly
          </Link>
        </div>

      </div>
    </div>
  );
}
