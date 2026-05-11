import sgMail from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'studio@hallofmirrorstattoo.com';
const STUDIO_EMAIL = process.env.STUDIO_EMAIL || 'studio@hallofmirrorstattoo.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://hall-of-mirrors-tattoo.vercel.app';

if (API_KEY) {
  sgMail.setApiKey(API_KEY);
}

async function send(msg: sgMail.MailDataRequired): Promise<void> {
  if (!API_KEY) {
    console.log('[email] SENDGRID_API_KEY not set — skipping send to:', msg.to);
    return;
  }
  try {
    await sgMail.send(msg);
  } catch (err: any) {
    console.error('[email] SendGrid error:', err?.response?.body || err?.message || err);
  }
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0E0C09;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E0C09;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo bar -->
        <tr>
          <td style="padding:0 0 32px 0;text-align:center;border-bottom:1px solid #2A2520;">
            <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:22px;font-weight:400;color:#C9A84C;letter-spacing:0.05em;">
              Hall of Mirrors
            </p>
            <p style="margin:4px 0 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(201,168,76,0.45);">
              Tattoo Studio · Liverpool
            </p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px 0;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:32px 0 0;border-top:1px solid #2A2520;text-align:center;">
            <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(201,168,76,0.35);">
              Suite 3 · 34 Castle Street · Liverpool L2 0NR
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#635C52;">
              studio@hallofmirrorstattoo.com
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-style:italic;font-size:32px;font-weight:400;color:#F2EDE0;line-height:1.2;">${text}</h1>`;
}

function body(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#9A9082;">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #2A2520;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(201,168,76,0.5);width:140px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0 10px 20px;border-bottom:1px solid #2A2520;font-size:14px;color:#EDE8D8;vertical-align:top;">${value}</td>
  </tr>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:28px;padding:14px 32px;background:#C9A84C;color:#0E0C09;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;border-radius:2px;">${label}</a>`;
}

export async function sendBookingConfirmationToClient(data: {
  clientEmail: string;
  clientName: string;
  bookingReference: string;
  appointmentDate: Date;
  placement: string;
  estimatedSize: string;
  artistName?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(data.appointmentDate);

  const content = `
    ${heading(`Your appointment is confirmed.`)}
    ${body(`Thank you, ${data.clientName}. We have your booking on record and will be in touch to complete the consultation process.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('Date &amp; Time', dateStr)}
      ${detail('Placement', data.placement)}
      ${detail('Size', data.estimatedSize)}
      ${data.artistName ? detail('Artist', data.artistName) : ''}
    </table>
    ${body(`We will contact you to go through a consent form before your appointment. In the meantime, please avoid alcohol, blood thinners, and heavy sun exposure in the days before.`)}
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'View Your Dashboard')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Booking confirmed — ${data.bookingReference}`,
    html: baseTemplate(content),
  });
}

export async function sendBookingNotificationToStudio(data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bookingReference: string;
  appointmentDate: Date;
  placement: string;
  estimatedSize: string;
  description: string;
  artistName?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(data.appointmentDate);

  const content = `
    ${heading(`New booking request`)}
    ${body(`A new appointment has been submitted and is awaiting review.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('Client', data.clientName)}
      ${detail('Email', data.clientEmail)}
      ${detail('Phone', data.clientPhone)}
      ${detail('Date &amp; Time', dateStr)}
      ${detail('Placement', data.placement)}
      ${detail('Size', data.estimatedSize)}
      ${data.artistName ? detail('Artist', data.artistName) : ''}
      ${detail('Description', data.description)}
    </table>
    ${ctaButton(`${FRONTEND_URL}/artist/dashboard`, 'Review in Dashboard')}
  `;

  await send({
    to: STUDIO_EMAIL,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Booking System' },
    subject: `New booking: ${data.clientName} — ${dateStr}`,
    html: baseTemplate(content),
  });
}

export async function sendWelcomeEmail(data: {
  clientEmail: string;
  clientFirstName: string;
}): Promise<void> {
  const content = `
    ${heading(`Welcome to Hall of Mirrors.`)}
    ${body(`Hello ${data.clientFirstName} — your client account is ready. You can now track your bookings, share design ideas, and manage your consultations from one place.`)}
    ${body(`When your appointment is confirmed, your consent form and pre-appointment details will be available from your dashboard.`)}
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'Go to Your Dashboard')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: 'Welcome to Hall of Mirrors',
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail(data: {
  clientEmail: string;
  clientFirstName: string;
  resetToken: string;
}): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/client/reset-password?token=${data.resetToken}&email=${encodeURIComponent(data.clientEmail)}`;

  const content = `
    ${heading(`Reset your password.`)}
    ${body(`Hello ${data.clientFirstName} — use the link below to set a new password. This link expires in one hour.`)}
    ${body(`If you did not request this, you can safely ignore this email.`)}
    ${ctaButton(resetUrl, 'Reset Password')}
    <p style="margin:20px 0 0;font-family:'Courier New',monospace;font-size:10px;color:#635C52;word-break:break-all;">${resetUrl}</p>
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: 'Reset your password',
    html: baseTemplate(content),
  });
}

export async function sendConsentFormToClient(data: {
  clientEmail: string;
  clientName: string;
  bookingReference: string;
  formReference: string;
  pdfBase64: string;
}): Promise<void> {
  const content = `
    ${heading(`Your consent form is on record.`)}
    ${body(`Hello ${data.clientName} — thank you for completing your consent form. A copy is attached to this email for your records.`)}
    ${body(`Your booking is now confirmed. If you have any questions before your appointment, please don't hesitate to get in touch.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Booking', data.bookingReference)}
      ${detail('Form reference', data.formReference)}
    </table>
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'View Your Dashboard')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Consent form confirmed — ${data.bookingReference}`,
    html: baseTemplate(content),
    attachments: [
      {
        content: data.pdfBase64,
        filename: `consent-form-${data.formReference}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });
}

export async function sendConsentFormToStudio(data: {
  clientName: string;
  clientEmail: string;
  bookingReference: string;
  formReference: string;
  pdfBase64: string;
}): Promise<void> {
  const content = `
    ${heading(`New consent form submitted.`)}
    ${body(`A client has completed and signed their consent form. The signed document is attached.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Client', data.clientName)}
      ${detail('Email', data.clientEmail)}
      ${detail('Booking', data.bookingReference)}
      ${detail('Form reference', data.formReference)}
    </table>
    ${ctaButton(`${FRONTEND_URL}/artist/dashboard`, 'View in Dashboard')}
  `;

  await send({
    to: STUDIO_EMAIL,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Booking System' },
    subject: `Consent form signed: ${data.clientName} — ${data.bookingReference}`,
    html: baseTemplate(content),
    attachments: [
      {
        content: data.pdfBase64,
        filename: `consent-form-${data.formReference}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });
}

export async function sendConsultationResponseToClient(data: {
  clientEmail: string;
  clientName: string;
  artistName: string;
  responseMessage: string;
}): Promise<void> {
  const content = `
    ${heading(`A response to your consultation request.`)}
    ${body(`Hello ${data.clientName} — ${data.artistName} has responded to your consultation request.`)}
    <div style="margin:24px 0;padding:24px;border-left:2px solid #C9A84C;background:rgba(201,168,76,0.05);">
      <p style="margin:0;font-size:15px;line-height:1.75;color:#EDE8D8;font-style:italic;">"${data.responseMessage}"</p>
      <p style="margin:12px 0 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(201,168,76,0.5);">— ${data.artistName}</p>
    </div>
    ${body(`Log in to your dashboard to continue the conversation or book an appointment.`)}
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'View Your Dashboard')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Response from ${data.artistName} — Hall of Mirrors`,
    html: baseTemplate(content),
  });
}
