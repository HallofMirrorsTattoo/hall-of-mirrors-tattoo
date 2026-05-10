import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@hallofmirrors.tattoo';
const STUDIO_EMAIL = process.env.STUDIO_EMAIL || 'bookings@hallofmirrors.tattoo';
const ARTIST_DASHBOARD_URL = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/artist/dashboard`
  : 'http://localhost:3000/artist/dashboard';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface BookingData {
  id: string;
  booking_reference: string;
  appointment_date_time: Date;
  tattoo_description: string;
  placement: string;
  estimated_size: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  artist?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export async function sendNewBookingNotification(booking: BookingData) {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('⚠️ SendGrid API key not configured, skipping email');
      return;
    }

    const clientName = booking.user?.first_name
      ? `${booking.user.first_name} ${booking.user.last_name}`
      : booking.guest_name || 'Unknown';

    const clientEmail = booking.user?.email || booking.guest_email;
    const clientPhone = booking.user?.phone || booking.guest_phone;

    const appointmentDate = new Date(booking.appointment_date_time).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Email to studio (all bookings)
    const studioEmailBody = `
      <h2>New Booking Request</h2>
      <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>

      <h3>Client Details</h3>
      <p><strong>Name:</strong> ${clientName}</p>
      <p><strong>Email:</strong> ${clientEmail}</p>
      <p><strong>Phone:</strong> ${clientPhone}</p>

      <h3>Appointment Details</h3>
      <p><strong>Date & Time:</strong> ${appointmentDate}</p>
      <p><strong>Placement:</strong> ${booking.placement}</p>
      <p><strong>Estimated Size:</strong> ${booking.estimated_size}</p>

      <h3>Design Description</h3>
      <p>${booking.tattoo_description}</p>

      ${booking.artist ? `<p><strong>Assigned to:</strong> ${booking.artist.full_name}</p>` : '<p><strong>Status:</strong> Unassigned (Available for all artists)</p>'}

      <p><a href="${ARTIST_DASHBOARD_URL}" style="background: #1a1a2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Dashboard</a></p>
    `;

    const studioMsg = {
      to: STUDIO_EMAIL,
      from: FROM_EMAIL,
      subject: `New Booking: ${clientName} - ${booking.booking_reference}`,
      html: studioEmailBody,
    };

    await sgMail.send(studioMsg);
    console.log(`✅ Studio email sent to ${STUDIO_EMAIL}`);

    // Email to assigned artist (if exists)
    if (booking.artist) {
      const artistEmailBody = `
        <h2>You Have a New Booking Request!</h2>
        <p>Hi ${booking.artist.full_name},</p>

        <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>

        <h3>Client Details</h3>
        <p><strong>Name:</strong> ${clientName}</p>
        <p><strong>Email:</strong> ${clientEmail}</p>
        <p><strong>Phone:</strong> ${clientPhone}</p>

        <h3>Appointment Details</h3>
        <p><strong>Date & Time:</strong> ${appointmentDate}</p>
        <p><strong>Placement:</strong> ${booking.placement}</p>
        <p><strong>Estimated Size:</strong> ${booking.estimated_size}</p>

        <h3>Design Description</h3>
        <p>${booking.tattoo_description}</p>

        <p>Log in to your dashboard to accept or reject this booking.</p>
        <p><a href="${ARTIST_DASHBOARD_URL}" style="background: #d4af37; color: #1a1a2e; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View in Dashboard</a></p>
      `;

      const artistMsg = {
        to: booking.artist.email,
        from: FROM_EMAIL,
        subject: `New Booking: ${clientName}`,
        html: artistEmailBody,
      };

      await sgMail.send(artistMsg);
      console.log(`✅ Artist email sent to ${booking.artist.email}`);
    } else {
      // Email to all active artists (unassigned booking)
      console.log('📧 Unassigned booking - notifying all active artists');
      // Could implement here: fetch all active artists and send emails
      // For now, studio email serves as notification to review and assign
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    // Don't crash the booking process if email fails
  }
}

export async function sendBookingConfirmationToClient(booking: BookingData) {
  try {
    console.log('📧 Attempting to send client confirmation email...');

    if (!SENDGRID_API_KEY) {
      console.warn('⚠️ SendGrid API key not configured, skipping email');
      return;
    }

    const clientName = booking.user?.first_name
      ? `${booking.user.first_name} ${booking.user.last_name}`
      : booking.guest_name || 'Client';

    const clientEmail = booking.user?.email || booking.guest_email;

    console.log(`📧 Client email target: ${clientEmail}`);

    if (!clientEmail) {
      console.warn('⚠️ No client email provided, skipping confirmation');
      return;
    }

    const appointmentDate = new Date(booking.appointment_date_time).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailBody = `
      <h2>Booking Confirmation</h2>
      <p>Hi ${clientName},</p>

      <p>Thank you for booking with Hall of Mirrors Tattoo Studio! We've received your booking request.</p>

      <h3>Your Booking Details</h3>
      <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
      <p><strong>Date & Time:</strong> ${appointmentDate}</p>
      <p><strong>Placement:</strong> ${booking.placement}</p>
      <p><strong>Estimated Size:</strong> ${booking.estimated_size}</p>

      <h3>Your Design Description</h3>
      <p>${booking.tattoo_description}</p>

      <p>Our team will review your booking and get back to you shortly to confirm your appointment and discuss any design details.</p>

      <p>If you have any questions, feel free to contact us at ${STUDIO_EMAIL}.</p>

      <p>Looking forward to creating something amazing with you!</p>
      <p><strong>Hall of Mirrors Tattoo Studio</strong></p>
    `;

    const msg = {
      to: clientEmail,
      from: FROM_EMAIL,
      subject: `Booking Confirmation - ${booking.booking_reference}`,
      html: emailBody,
    };

    await sgMail.send(msg);
    console.log(`✅ Client confirmation email sent to ${clientEmail}`);
  } catch (error) {
    console.error('❌ Client confirmation email failed:', error);
  }
}

export async function sendBookingStatusUpdate(
  clientEmail: string,
  clientName: string,
  bookingReference: string,
  status: string,
  artistName: string,
  message?: string
) {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('⚠️ SendGrid API key not configured, skipping email');
      return;
    }

    let statusMessage = '';
    let statusColor = '#1a1a2e';

    switch (status) {
      case 'confirmed':
        statusMessage = `Your booking has been <strong>confirmed</strong> by ${artistName}!`;
        statusColor = '#28a745';
        break;
      case 'rejected':
        statusMessage = `Unfortunately, your booking request has been <strong>rejected</strong>.`;
        statusColor = '#dc3545';
        break;
      case 'pending_details':
        statusMessage = `${artistName} would like to discuss some details about your design.`;
        statusColor = '#ffc107';
        break;
      default:
        statusMessage = `Your booking status has been updated to: <strong>${status}</strong>`;
    }

    const emailBody = `
      <h2 style="color: ${statusColor};">${statusMessage}</h2>
      <p><strong>Booking Reference:</strong> ${bookingReference}</p>

      ${message ? `<h3>Message from the artist:</h3><p>${message}</p>` : ''}

      <p>We'll be in touch soon!</p>
    `;

    const msg = {
      to: clientEmail,
      from: FROM_EMAIL,
      subject: `Booking Update: ${bookingReference}`,
      html: emailBody,
    };

    await sgMail.send(msg);
    console.log(`✅ Status update email sent to ${clientEmail}`);
  } catch (error) {
    console.error('❌ Status email sending failed:', error);
  }
}
