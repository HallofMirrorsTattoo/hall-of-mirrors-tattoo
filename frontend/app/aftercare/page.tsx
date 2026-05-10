const phases = [
  {
    title: 'First 3 Hours',
    items: [
      'Keep bandage or protective film on — do not remove early',
      'No water exposure',
      'Avoid direct sunlight',
      'Do not touch or pick at the tattoo',
    ],
  },
  {
    title: 'First 24 Hours',
    items: [
      'Remove bandage after 2–3 hours',
      'Gently wash with unscented soap and warm water',
      'Pat dry with a clean paper towel — never cloth',
      'Apply a thin layer of aftercare balm',
      'Let it air dry between applications',
    ],
  },
  {
    title: 'Days 2–7',
    items: [
      'Wash 2–3 times daily with unscented soap',
      'Apply aftercare balm after each wash',
      'Avoid tight clothing over the tattoo',
      'No swimming, baths, or saunas',
      'Do not pick or scratch at peeling skin',
      'Stay out of direct sunlight',
    ],
  },
  {
    title: 'Weeks 2–4',
    items: [
      'Continue moisturising with lotion or aftercare balm',
      'Apply SPF 30+ sunscreen if going outside',
      'Avoid strenuous exercise or heavy sweating',
      'Tattoo may still feel slightly tender — this is normal',
    ],
  },
];

export default function Aftercare() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: '#2a2a2a' }}>
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div className="space-y-4">
          <span className="eyebrow">Post-Session Care</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light">
            Aftercare Instructions
          </h1>
          <p className="text-primary-light/70">
            Following these steps protects your investment and ensures the best possible heal.
          </p>
        </div>

        {/* Phase cards */}
        <div className="space-y-4">
          {phases.map((phase, i) => (
            <div key={phase.title} className="card-premium">
              <div className="card-premium-inner space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-accent-gold font-serif font-bold text-lg w-6 text-center">
                    {i + 1}
                  </span>
                  <h2 className="font-serif font-semibold text-primary-light">{phase.title}</h2>
                </div>
                <ul className="space-y-2 pl-9">
                  {phase.items.map((item) => (
                    <li key={item} className="text-primary-light/65 text-sm flex gap-2">
                      <span className="text-accent-gold/60 mt-0.5">–</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="card-premium border border-accent-gold/20">
          <div className="card-premium-inner space-y-2">
            <p className="font-semibold text-primary-light text-sm">Important</p>
            <p className="text-primary-light/65 text-sm leading-relaxed">
              If you experience excessive redness, swelling, warmth, or any discharge lasting more
              than a few days — or any signs of infection — contact a healthcare professional
              immediately. Do not wait.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
