export default function Privacy() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: 'var(--bg)' }}><div className="max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light mb-10">Privacy Policy</h1>

      <div className="space-y-6 text-primary-light/70">
        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">1. Data We Collect</h2>
          <p>
            Hall of Mirrors collects the following information:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Name, email address, phone number, date of birth</li>
            <li>Address and location information</li>
            <li>Medical history (allergies, conditions, medications)</li>
            <li>Tattoo design ideas and reference images</li>
            <li>Payment information (handled securely by Stripe/PayPal)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">2. How We Use Your Data</h2>
          <p>
            Your data is used for:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Booking and appointment management</li>
            <li>Health and safety considerations</li>
            <li>Legal compliance (consent forms)</li>
            <li>Email notifications and reminders</li>
            <li>Improving our services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">3. Data Retention</h2>
          <p>
            Client records are retained for a minimum of 6 years (as required by Liverpool City Council for health records).
            Temporary files (design images from guests) are deleted after 60 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">4. Your Rights</h2>
          <p>
            Under GDPR, you have the right to:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion (subject to legal retention periods)</li>
            <li>Restrict processing</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">5. Security</h2>
          <p>
            Your data is encrypted in transit (HTTPS) and at rest. Medical information is encrypted separately.
            We do not store payment card information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">6. Third Parties</h2>
          <p>
            We share data only with necessary third parties:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Stripe and PayPal (payment processing)</li>
            <li>SendGrid (email delivery)</li>
            <li>AWS S3 (file storage)</li>
          </ul>
          <p className="mt-2">All third parties are GDPR-compliant.</p>
        </section>
      </div>
      </div>
    </div>
  );
}
