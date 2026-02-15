import { Resend } from 'resend'

// Lazy-load Resend client only when API key is available
let resend: Resend | null = null
function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

const FROM_EMAIL = 'ParkBook <noreply@bitcoinpark.com>'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const client = getResendClient()
  if (!client) {
    console.warn('RESEND_API_KEY not set, skipping email send')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Email templates
export function bookingConfirmationEmail(booking: {
  title: string
  spaceName: string
  locationName: string
  startTime: Date
  endTime: Date
  userName: string
}) {
  const startDate = booking.startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const startTimeStr = booking.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const endTimeStr = booking.endTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return {
    subject: `Booking Confirmed: ${booking.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0e3c07; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .detail-row { display: flex; margin: 10px 0; }
            .detail-label { font-weight: bold; min-width: 100px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${booking.userName},</p>
              <p>Your booking has been confirmed!</p>
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Event:</span>
                  <span>${booking.title}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Space:</span>
                  <span>${booking.spaceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span>${booking.locationName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span>${startDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span>${startTimeStr} - ${endTimeStr}</span>
                </div>
              </div>
              <p>Need to make changes? Log in to ParkBook to modify or cancel your booking.</p>
            </div>
            <div class="footer">
              <p>Bitcoin Park - Building the Bitcoin community</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function bookingCancellationEmail(booking: {
  title: string
  spaceName: string
  startTime: Date
  userName: string
  reason?: string
}) {
  const startDate = booking.startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return {
    subject: `Booking Cancelled: ${booking.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${booking.userName},</p>
              <p>Your booking for <strong>${booking.title}</strong> at <strong>${booking.spaceName}</strong> on ${startDate} has been cancelled.</p>
              ${booking.reason ? `<p><strong>Reason:</strong> ${booking.reason}</p>` : ''}
              <p>If you didn't request this cancellation, please contact us.</p>
            </div>
            <div class="footer">
              <p>Bitcoin Park - Building the Bitcoin community</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function passwordResetEmail(options: { userName: string; resetUrl: string }) {
  return {
    subject: 'Reset Your ParkBook Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0e3c07; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #0e3c07; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>Hi ${options.userName},</p>
              <p>We received a request to reset your ParkBook password. Click the button below to set a new password:</p>
              <p style="text-align: center;">
                <a href="${options.resetUrl}" class="button">Reset Password</a>
              </p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Bitcoin Park - Building the Bitcoin community</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}
