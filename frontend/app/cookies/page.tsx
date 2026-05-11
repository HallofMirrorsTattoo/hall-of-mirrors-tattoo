export default function Cookies() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: 'var(--bg)' }}><div className="max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light mb-10">Cookie Policy</h1>

      <div className="space-y-6 text-primary-light/70">
        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device that help us remember your preferences and
            provide you with a better experience.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">Types of Cookies We Use</h2>
          <p>
            <strong>Essential Cookies:</strong> Required for the site to function (authentication, security).
            These are always active.
          </p>
          <p className="mt-4">
            <strong>Analytics Cookies:</strong> Help us understand how you use the site (optional, requires consent).
          </p>
          <p className="mt-4">
            <strong>Preference Cookies:</strong> Remember your choices and settings (optional).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings. Most browsers allow you to refuse cookies
            or alert you when cookies are being sent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">GDPR Compliance</h2>
          <p>
            Hall of Mirrors complies with GDPR cookie requirements. We obtain consent before storing non-essential cookies.
            You can withdraw consent at any time.
          </p>
        </section>
      </div>
      </div>
    </div>
  );
}
