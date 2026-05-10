export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif text-accent-gold mb-4">About Hall of Mirrors</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
        <div>
          <h2 className="text-3xl font-serif text-accent-gold mb-6">Meet Robyn</h2>
          <p className="text-white/80 mb-4">
            Placeholder - Robyn's bio will be provided and customized here.
          </p>
          <p className="text-white/80 mb-4">
            Years of experience, specialties, and personal touch about the artist.
          </p>
        </div>

        <div className="bg-white/5 border border-accent-gold/20 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-accent-gold mb-4">Studio Credentials</h3>
          <ul className="space-y-3 text-white/80">
            <li>✓ Liverpool City Council Registered (Ref: A11394900)</li>
            <li>✓ Hepatitis B Vaccinated</li>
            <li>✓ Professional Sterilization Standards</li>
            <li>✓ Autoclave Certified</li>
            <li>✓ GDPR Compliant</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
