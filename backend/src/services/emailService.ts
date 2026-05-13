import sgMail from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'studio@hallofmirrorstattoo.com';
const STUDIO_EMAIL = process.env.STUDIO_EMAIL || 'studio@hallofmirrorstattoo.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://hall-of-mirrors-tattoo.vercel.app';

// ── Calendar helpers ──────────────────────────────────────────────────────────

function buildGoogleCalUrl(dateStr: string, startHour: string, endHour: string): string {
  const d = dateStr.replace(/-/g, '');
  const start = startHour.replace(':', '') + '00';
  const end = endHour.replace(':', '') + '00';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Tattoo Session — Hall of Mirrors',
    dates: `${d}T${start}/${d}T${end}`,
    details: 'Tattoo session at Hall of Mirrors Tattoo Studio, Liverpool.\n\nRemember to eat well beforehand and wear clothing that gives easy access to the area being tattooed.',
    location: 'Suite 3, 34 Castle Street, Liverpool L2 0NR',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsBase64(dateStr: string, startHour: string, endHour: string, bookingRef: string): string {
  const d = dateStr.replace(/-/g, '');
  const start = startHour.replace(':', '') + '00';
  const end = endHour.replace(':', '') + '00';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hall of Mirrors Tattoo//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${bookingRef}@hallofmirrorstattoo.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/London:${d}T${start}`,
    `DTEND;TZID=Europe/London:${d}T${end}`,
    'SUMMARY:Tattoo Session — Hall of Mirrors',
    'DESCRIPTION:Your tattoo session at Hall of Mirrors Tattoo Studio\\nSuite 3\\, 34 Castle Street\\, Liverpool L2 0NR',
    'LOCATION:Suite 3\\, 34 Castle Street\\, Liverpool L2 0NR',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return Buffer.from(ics).toString('base64');
}

function calendarBlock(googleUrl: string): string {
  return `
    <div style="margin:24px 0;padding:16px 20px;border:1px solid #2A2520;border-radius:4px;display:flex;align-items:center;gap:16px;">
      <div>
        <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(201,168,76,0.5);">Add to calendar</p>
        <a href="${googleUrl}" target="_blank" rel="noopener noreferrer"
          style="display:inline-block;padding:8px 20px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:#C9A84C;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
          Google Calendar ↗
        </a>
        <p style="margin:6px 0 0;font-size:11px;color:#635C52;">Or open the attached .ics file to add to Apple Calendar or Outlook.</p>
      </div>
    </div>`;
}

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
  startTime?: string;
  placement: string;
  estimatedSize: string;
  artistName?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(data.appointmentDate);

  const timeDisplay = data.startTime ? formatHour(data.startTime) : '';

  // Tentative calendar block (pending confirmation — 2hr placeholder duration)
  let calSection = '';
  if (data.startTime) {
    const apptDateStr = data.appointmentDate.toISOString().split('T')[0];
    const startH = parseInt(data.startTime.substring(0, 2), 10);
    const endHour = String(startH + 2).padStart(2, '0') + ':00';
    const googleUrl = buildGoogleCalUrl(apptDateStr, data.startTime, endHour);
    calSection = `
      <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(201,168,76,0.4);">Pencil it in</p>
      <a href="${googleUrl}" target="_blank" rel="noopener noreferrer"
        style="display:inline-block;margin-bottom:24px;padding:8px 20px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);color:rgba(201,168,76,0.7);font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
        Save to Google Calendar ↗
      </a>
      <p style="margin:-16px 0 24px;font-size:11px;color:#635C52;">Duration is provisional — we&apos;ll send a confirmed calendar invite once your session is locked in.</p>`;
  }

  const content = `
    ${heading(`Booking request received.`)}
    ${body(`Thank you, ${data.clientName}. We have your booking request on record and will confirm your appointment shortly.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('Requested date', dateStr + (timeDisplay ? ` at ${timeDisplay}` : ''))}
      ${detail('Placement', data.placement)}
      ${detail('Size', data.estimatedSize)}
      ${data.artistName ? detail('Artist', data.artistName) : ''}
    </table>
    ${calSection}
    ${body(`Your artist will review your request and confirm the session. You&apos;ll receive a separate email once your appointment is locked in.`)}
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'View Your Dashboard')}
    <div style="margin-top:28px;padding:20px 24px;border:1px solid rgba(201,168,76,0.18);border-radius:4px;background:rgba(201,168,76,0.04);">
      <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(201,168,76,0.5);">Message your artist</p>
      <p style="margin:0 0 14px;font-size:13px;line-height:1.65;color:#9A9082;">Create a free client account to track your booking, message your artist directly, and manage your consent form — all in one place.</p>
      <a href="${FRONTEND_URL}/client/signup?email=${encodeURIComponent(data.clientEmail)}"
         style="display:inline-block;padding:10px 24px;background:none;border:1px solid rgba(201,168,76,0.35);color:#C9A84C;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
        Set up your account →
      </a>
    </div>
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Booking request received — ${data.bookingReference}`,
    html: baseTemplate(content),
  });
}

export async function sendBookingConfirmedToClient(data: {
  clientEmail: string;
  clientName: string;
  bookingReference: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  notifyEndTime: boolean;
  artistName?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(data.appointmentDate);

  const startDisplay = formatHour(data.startTime);
  const endDisplay = formatHour(data.endTime);

  const sessionLine = data.notifyEndTime
    ? `${dateStr} from ${startDisplay} until ${endDisplay}`
    : `${dateStr} starting at ${startDisplay}`;

  const finishNote = data.notifyEndTime
    ? ''
    : body(`Your artist will let you know on the day when to expect to finish.`);

  const apptDateStr = data.appointmentDate.toISOString().split('T')[0];
  const googleUrl = buildGoogleCalUrl(apptDateStr, data.startTime, data.endTime);
  const icsBase64 = buildIcsBase64(apptDateStr, data.startTime, data.endTime, data.bookingReference);

  const content = `
    ${heading(`Your appointment is confirmed.`)}
    ${body(`Great news, ${data.clientName} — your tattoo session has been scheduled.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('Session', sessionLine)}
      ${data.artistName ? detail('Artist', data.artistName) : ''}
    </table>
    ${finishNote}
    ${calendarBlock(googleUrl)}
    ${body(`You&apos;ll need to complete a consent form before your session if you haven&apos;t already. You can find it in your dashboard.`)}
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'View Your Dashboard')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Appointment confirmed — ${data.bookingReference}`,
    html: baseTemplate(content),
    attachments: [
      {
        content: icsBase64,
        filename: `appointment-${data.bookingReference}.ics`,
        type: 'text/calendar',
        disposition: 'attachment',
      },
    ],
  });
}

function formatHour(time: string): string {
  const hour = parseInt(time.substring(0, 2), 10);
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
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
  artistEmail?: string;
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

  // Always notify studio catch-all; if a specific artist was booked, notify them too
  const recipients = [STUDIO_EMAIL];
  if (data.artistEmail && data.artistEmail !== STUDIO_EMAIL) {
    recipients.push(data.artistEmail);
  }

  for (const to of recipients) {
    await send({
      to,
      from: { email: FROM_EMAIL, name: 'Hall of Mirrors Booking System' },
      subject: `New booking: ${data.clientName} — ${dateStr}`,
      html: baseTemplate(content),
    });
  }
}

export async function sendReminderToClient(data: {
  clientEmail: string;
  clientName: string;
  bookingReference: string;
  appointmentDate: Date;
  startTime?: string;
  endTime?: string | null;
  notifyEndTime: boolean;
  artistName?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(data.appointmentDate);

  const startDisplay = data.startTime ? formatHour(data.startTime) : '';
  const timeInfo = data.startTime
    ? (data.notifyEndTime && data.endTime
        ? `${dateStr} from ${startDisplay} until ${formatHour(data.endTime)}`
        : `${dateStr} at ${startDisplay}`)
    : dateStr;

  let calSection = '';
  if (data.startTime && data.endTime) {
    const apptDateStr = data.appointmentDate.toISOString().split('T')[0];
    const googleUrl = buildGoogleCalUrl(apptDateStr, data.startTime, data.endTime);
    calSection = `<p style="margin:16px 0 0;">
      <a href="${googleUrl}" target="_blank" rel="noopener noreferrer"
        style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(201,168,76,0.7);text-decoration:none;">
        Open in Google Calendar ↗
      </a>
    </p>`;
  }

  const content = `
    ${heading(`Your appointment is tomorrow.`)}
    ${body(`Hi ${data.clientName} — just a reminder that your tattoo session is coming up.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('Session', timeInfo)}
      ${data.artistName ? detail('Artist', data.artistName) : ''}
      ${detail('Studio', 'Suite 3, 34 Castle Street, Liverpool L2 0NR')}
    </table>
    <div style="margin:24px 0;padding:16px 20px;border-left:2px solid rgba(201,168,76,0.35);background:rgba(201,168,76,0.04);">
      <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(201,168,76,0.5);">Before you arrive</p>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.65;color:#9A9082;">Eat a full meal, stay hydrated, and wear clothing that allows easy access to the area being tattooed. Avoid alcohol for 24 hours before your session.</p>
    </div>
    ${calSection}
    ${body(`If you need to make any changes, please contact the studio as soon as possible.`)}
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'View Your Dashboard')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Reminder: your tattoo session is tomorrow — ${data.bookingReference}`,
    html: baseTemplate(content),
  });
}

export async function sendReminderToArtist(data: {
  artistEmail: string;
  artistName?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  bookingReference: string;
  appointmentDate: Date;
  startTime?: string;
  durationMinutes?: number;
  placement?: string;
  description?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(data.appointmentDate);

  const startDisplay = data.startTime ? formatHour(data.startTime) : '';
  const endDisplay = data.startTime && data.durationMinutes
    ? formatHour(String(parseInt(data.startTime.substring(0, 2)) + Math.round(data.durationMinutes / 60)).padStart(2, '0') + ':00')
    : null;

  const sessionLine = startDisplay
    ? (endDisplay ? `${startDisplay} → ${endDisplay}` : startDisplay)
    : '—';

  const content = `
    ${heading(`Appointment tomorrow.`)}
    ${body(`${data.artistName ?? 'Hey'} — you have a session booked for tomorrow. Here are the details.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('Date', dateStr)}
      ${detail('Time', sessionLine)}
      ${detail('Client', data.clientName)}
      ${detail('Email', data.clientEmail)}
      ${data.clientPhone ? detail('Phone', data.clientPhone) : ''}
      ${data.placement ? detail('Placement', data.placement) : ''}
      ${data.description ? detail('Design', data.description) : ''}
    </table>
    ${ctaButton(`${FRONTEND_URL}/artist/dashboard`, 'Open Dashboard')}
  `;

  await send({
    to: data.artistEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Booking System' },
    subject: `Tomorrow: ${data.clientName} at ${startDisplay || dateStr} — ${data.bookingReference}`,
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

export async function sendArtistCancellationToClient(data: {
  clientEmail: string;
  clientName: string;
  bookingReference: string;
  appointmentDate: Date;
  artistName?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(data.appointmentDate);

  const content = `
    ${heading(`Your appointment has been cancelled.`)}
    ${body(`Hi ${data.clientName} — we&apos;re sorry to let you know that your upcoming session on ${dateStr} has been cancelled by the studio.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('Original date', dateStr)}
      ${data.artistName ? detail('Artist', data.artistName) : ''}
    </table>
    ${body(`Please get in touch with us if you&apos;d like to rebook or if you have any questions. We apologise for any inconvenience caused.`)}
    ${ctaButton(`${FRONTEND_URL}/booking`, 'Book a new session')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Your appointment has been cancelled — ${data.bookingReference}`,
    html: baseTemplate(content),
  });
}

export async function sendArtistRescheduleToClient(data: {
  clientEmail: string;
  clientName: string;
  bookingReference: string;
  newAppointmentDate: Date;
  newStartTime: string;
  artistName?: string;
}): Promise<void> {
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(data.newAppointmentDate);

  const apptDateStr = data.newAppointmentDate.toISOString().split('T')[0];
  const startH = parseInt(data.newStartTime.substring(0, 2), 10);
  const endHour = String(startH + 2).padStart(2, '0') + ':00';
  const googleUrl = buildGoogleCalUrl(apptDateStr, data.newStartTime, endHour);

  const content = `
    ${heading(`Your appointment has been rescheduled.`)}
    ${body(`Hi ${data.clientName} — your tattoo session has been moved to a new date and time. Here are your updated details.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detail('Reference', data.bookingReference)}
      ${detail('New date', `${dateStr} at ${formatHour(data.newStartTime)}`)}
      ${data.artistName ? detail('Artist', data.artistName) : ''}
    </table>
    ${body(`Your deposit has been carried over to the new appointment. If this date doesn&apos;t work for you, please get in touch as soon as possible.`)}
    <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(201,168,76,0.4);">Update your calendar</p>
    <a href="${googleUrl}" target="_blank" rel="noopener noreferrer"
      style="display:inline-block;margin-bottom:24px;padding:8px 20px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);color:rgba(201,168,76,0.7);font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
      Update Google Calendar ↗
    </a>
    ${ctaButton(`${FRONTEND_URL}/client/dashboard`, 'View your dashboard')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: 'Hall of Mirrors Tattoo' },
    subject: `Appointment rescheduled — ${data.bookingReference}`,
    html: baseTemplate(content),
  });
}

export async function sendRebookInvite(data: {
  clientEmail: string;
  clientName: string;
  artistName?: string;
}): Promise<void> {
  const content = `
    ${heading(`Ready for your next session?`)}
    ${body(`Hello ${data.clientName} — we hope your tattoo has healed beautifully.`)}
    ${body(`If you&apos;re thinking about your next piece, ${data.artistName ? `${data.artistName} would` : `we&apos;d`} love to have you back in the studio. Whether it&apos;s a continuation of an existing piece or something entirely new, we&apos;re here when you&apos;re ready.`)}
    ${ctaButton(`${FRONTEND_URL}/booking`, 'Book your next session')}
  `;

  await send({
    to: data.clientEmail,
    from: { email: FROM_EMAIL, name: data.artistName ? `${data.artistName} at Hall of Mirrors` : 'Hall of Mirrors Tattoo' },
    subject: `Ready for your next session? — Hall of Mirrors`,
    html: baseTemplate(content),
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
