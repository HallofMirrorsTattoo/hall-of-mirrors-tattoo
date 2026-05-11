export default function Terms() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light mb-10">Terms of Service</h1>

      <div className="space-y-6 text-primary-light/70">
        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">1. Age Requirement</h2>
          <p>
            Clients must be 18 years of age or older. Valid photo ID must be presented at the time of appointment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">2. Booking & Cancellation Policy</h2>
          <p>
            <strong>Cancellation:</strong> Free cancellation up to 24 hours before your appointment.
            Cancellations within 24 hours will result in forfeiture of the deposit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">3. Deposits</h2>
          <p>
            A non-refundable deposit is required to secure your booking. Exceptions: If Hall of Mirrors
            cancels or rejects the booking, a full refund is issued. If you cancel more than 24 hours before
            your appointment, you receive a full refund.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">4. Health & Medical Considerations</h2>
          <p>
            You must disclose all relevant medical conditions, allergies, and medications during the booking process.
            Hall of Mirrors reserves the right to refuse service if we believe it poses a health risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">5. Liability</h2>
          <p>
            Hall of Mirrors is not liable for allergic reactions, infections, fading, scarring, or other
            complications that may arise from tattooing. Proper aftercare is the responsibility of the client.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">6. Aftercare Responsibility</h2>
          <p>
            You are responsible for following all aftercare instructions provided. Failure to do so may result
            in infection or poor healing.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-primary-light font-semibold mb-3">7. Changes to Terms</h2>
          <p>
            Hall of Mirrors reserves the right to modify these terms at any time. Changes are effective immediately.
          </p>
        </section>
      </div>
      </div>
    </div>
  );
}
