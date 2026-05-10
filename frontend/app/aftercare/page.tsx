export default function Aftercare() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif text-accent-gold mb-4">Aftercare Instructions</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-serif text-accent-gold mb-4">First 3 Hours</h2>
          <ul className="space-y-2 text-white/80 list-disc list-inside">
            <li>Keep bandage/protective layer on for the first few hours</li>
            <li>Do not expose to water</li>
            <li>Avoid direct sunlight</li>
            <li>Do not touch or pick at the tattoo</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-accent-gold mb-4">First 24 Hours</h2>
          <ul className="space-y-2 text-white/80 list-disc list-inside">
            <li>Remove bandage after 2-3 hours</li>
            <li>Gently wash with unscented soap and warm water</li>
            <li>Pat dry with clean paper towel (not cloth)</li>
            <li>Apply thin layer of aftercare balm</li>
            <li>Let air dry between applications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-accent-gold mb-4">Days 2-7</h2>
          <ul className="space-y-2 text-white/80 list-disc list-inside">
            <li>Continue washing 2-3 times daily with unscented soap</li>
            <li>Apply aftercare balm after each wash</li>
            <li>Avoid tight clothing over the tattoo</li>
            <li>Avoid swimming, baths, and saunas</li>
            <li>Do not pick or scratch at peeling skin</li>
            <li>Avoid direct sunlight</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-accent-gold mb-4">Weeks 2-4</h2>
          <ul className="space-y-2 text-white/80 list-disc list-inside">
            <li>Continue moisturizing with lotion or aftercare balm</li>
            <li>Use SPF 30+ sunscreen if exposed to sun</li>
            <li>Avoid strenuous exercise or heavy sweating</li>
            <li>Continue avoiding direct sunlight</li>
            <li>Tattoo may still be slightly tender</li>
          </ul>
        </section>

        <div className="glassmorphism p-6 bg-rust/10 border-rust/30">
          <p className="text-white/90">
            <strong>Important:</strong> If you experience excessive redness, swelling, warmth, or discharge lasting more than a few days, or any signs of infection, contact a healthcare professional immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
