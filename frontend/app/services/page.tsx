export default function Services() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif text-accent-gold mb-4">Services & Pricing</h1>
      <p className="text-white/70 mb-12">All pricing is placeholder and will be customized</p>

      <div className="space-y-6">
        <div className="glassmorphism p-6">
          <h3 className="text-xl font-semibold text-accent-gold">Small Tattoo (1-3")</h3>
          <p className="text-white/70 mt-2">Simple designs, quick sessions</p>
          <p className="text-2xl text-accent-gold mt-4">£150 - £250</p>
        </div>
        <div className="glassmorphism p-6">
          <h3 className="text-xl font-semibold text-accent-gold">Medium Tattoo (3-6")</h3>
          <p className="text-white/70 mt-2">Detail work, color, standard placement</p>
          <p className="text-2xl text-accent-gold mt-4">£300 - £500</p>
        </div>
        <div className="glassmorphism p-6">
          <h3 className="text-xl font-semibold text-accent-gold">Large Tattoo (6"+)</h3>
          <p className="text-white/70 mt-2">Complex designs, custom quotes</p>
          <p className="text-2xl text-accent-gold mt-4">Custom Quote</p>
        </div>
        <div className="glassmorphism p-6">
          <h3 className="text-xl font-semibold text-accent-gold">Cover-Up</h3>
          <p className="text-white/70 mt-2">Premium pricing, 20-30% extra</p>
          <p className="text-2xl text-accent-gold mt-4">Varies</p>
        </div>
        <div className="glassmorphism p-6">
          <h3 className="text-xl font-semibold text-accent-gold">Deposit</h3>
          <p className="text-white/70 mt-2">Required to secure booking</p>
          <p className="text-2xl text-accent-gold mt-4">TBD</p>
        </div>
      </div>
    </div>
  );
}
