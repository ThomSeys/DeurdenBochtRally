import { Resend } from 'resend';
import QRCode from 'qrcode';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { Database } from '~/lib/database.types';

type Participant = Database['public']['Tables']['participants']['Row'];

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set - emails will not be sent');
}

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Development mode: send all emails to test address
const isDevelopment = process.env.NODE_ENV !== 'production';
const DEV_EMAIL = 'thoms.seyssens@gmail.com';

export async function generateQRCodeFile(participant: Participant, baseUrl: string): Promise<string> {
  // Generate a validation URL using the provided base URL
  const qrUrl = `${baseUrl}/api/validate-qr?id=${participant.id}&email=${encodeURIComponent(participant.email)}`;

  try {
    // Create qr-codes directory in public folder
    const publicDir = join(process.cwd(), 'public', 'qr-codes');
    await mkdir(publicDir, { recursive: true });

    // Generate filename based on participant ID
    const filename = `${participant.id}.png`;
    const filepath = join(publicDir, filename);

    // Generate and save QR code to file
    await QRCode.toFile(filepath, qrUrl, {
      width: 400,
      margin: 2,
      color: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
    });

    // Return the public URL
    return `${baseUrl}/qr-codes/${filename}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export async function sendRegistrationConfirmationEmail(
  participant: Participant,
  eventName: string,
  baseUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Skipping email - RESEND_API_KEY not configured');
    return;
  }

  // Generate QR code and get hosted URL
  const qrCodeUrl = await generateQRCodeFile(participant, baseUrl);

  // In development, send to test email. In production, send to participant
  const recipientEmail = isDevelopment ? DEV_EMAIL : participant.email;
  const fromAddress = isDevelopment 
    ? 'Deur Den Bocht <onboarding@resend.dev>'
    : process.env.EMAIL_FROM || 'Deur Den Bocht <noreply@deurdenbocht.be>';

  try {
    await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: `Bevestiging registratie - ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #DC2626;
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .qr-container {
                background: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
              }
              .qr-container img {
                max-width: 300px;
                width: 100%;
                height: auto;
              }
              .info-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
              }
              strong {
                color: #DC2626;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🏍 ${eventName}</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Registratie bevestigd!</p>
            </div>
            
            <div class="content">
              <p>Dag ${participant.first_name},</p>
              
              <p>Je registratie voor <strong>${eventName}</strong> is bevestigd! We kijken ernaar uit om je te zien.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Jouw gegevens</h3>
                <p><strong>Naam:</strong> ${participant.first_name} ${participant.last_name}</p>
                <p><strong>Email:</strong> ${participant.email}</p>
                <p><strong>Betaalstatus:</strong> ${participant.payment_status === 'completed' ? '✅ Betaald' : '⏳ In behandeling'}</p>
              </div>
              
              <div class="qr-container">
                <h3 style="margin-top: 0;">📱 Jouw QR Code</h3>
                <p>Bewaar deze QR code - je hebt hem nodig op de dag van het event!</p>
                <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 300px; width: 100%; height: auto;" />
                <p style="font-size: 14px; color: #666; margin-top: 15px;">
                  Je kan deze QR code ook vinden in je dashboard op de website.
                </p>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">ℹ️ Belangrijke info</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Zorg dat je op tijd bent</li>
                  <li>Breng je QR code mee (op je telefoon of print uit)</li>
                  <li>Check je dashboard voor laatste updates</li>
                  <li>Veel plezier! 🎉</li>
                </ul>
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || 'https://deurdenbocht.be'}/dashboard" 
                   style="display: inline-block; background: #DC2626; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Ga naar Dashboard
                </a>
              </p>
            </div>
            
            <div class="footer">
              <p>Tot snel! 🏍💨</p>
              <p style="font-size: 12px; color: #999;">
                Deze email is automatisch verstuurd. Heb je vragen? Neem contact op via de website.
              </p>
            </div>
          </body>
        </html>
      `,
      tags: [
        {
          name: 'category',
          value: 'registration_confirmation',
        },
      ],
    });
    
    console.log(`Registration confirmation email sent to ${participant.email}`);
  } catch (error) {
    console.error('Error sending registration email:', error);
    throw error;
  }
}

export async function sendContactFormEmail(
  name: string,
  email: string,
  message: string,
  contactEmail: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Skipping email - RESEND_API_KEY not configured');
    return;
  }

  const recipientEmail = isDevelopment ? DEV_EMAIL : contactEmail;
  const fromAddress = isDevelopment 
    ? 'Deur Den Bocht <onboarding@resend.dev>'
    : process.env.EMAIL_FROM || 'Deur Den Bocht <noreply@deurdenbocht.be>';

  try {
    await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      replyTo: email,
      subject: `Nieuw contactformulier bericht van ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #DC2626;
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .info-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin: 0;">📧 Nieuw contactformulier bericht</h2>
            </div>
            
            <div class="content">
              <div class="info-box">
                <p><strong>Van:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">Bericht:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Je kan direct antwoorden op deze email om ${name} te contacteren.
              </p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log(`Contact form email sent from ${email} to ${contactEmail}`);
  } catch (error) {
    console.error('Error sending contact form email:', error);
    throw error;
  }
}
