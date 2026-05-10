export default function Portfolio() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif text-accent-gold mb-4">Portfolio</h1>
      <p className="text-white/70 mb-12">Gallery of completed tattoo work</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 border border-accent-gold/20 rounded-lg flex items-center justify-center">
            <p className="text-white/50">Placeholder {i + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
