import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || 'noreply@deurdenbocht.be',
      to,
      subject,
      html,
    });

    console.info('[email] sent successfully', { to, subject, id: result.data?.id });
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[email] failed to send', { to, subject, error });
    return { success: false, error };
  }
}

// Email Templates

export function registrationConfirmationEmail(participant: {
  first_name: string;
  last_name: string;
  email: string;
  id: string;
  qr_code_image_url?: string;
  formula: string;
  ride_type: string;
}) {
  const checkInUrl = `${process.env.PUBLIC_URL || 'https://deurdenbocht.be'}/check-in/${participant.id}`;
  
  return {
    subject: '✅ Registratie Bevestiging - Deur Den Bocht 2026',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #991b1b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #e5e7eb; }
            .qr-code { text-align: center; margin: 30px 0; }
            .qr-code img { max-width: 300px; border: 4px solid #991b1b; border-radius: 8px; }
            .button { display: inline-block; background: #991b1b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏍️ Welkom bij Deur Den Bocht 2026!</h1>
            </div>
            <div class="content">
              <p>Beste ${participant.first_name} ${participant.last_name},</p>
              
              <p>Je registratie is succesvol ontvangen! We kijken ernaar uit om je te verwelkomen op <strong>16 mei 2026</strong>.</p>
              
              <div class="info-box">
                <h3>📋 Jouw Gegevens</h3>
                <p><strong>Naam:</strong> ${participant.first_name} ${participant.last_name}</p>
                <p><strong>Email:</strong> ${participant.email}</p>
                <p><strong>Formule:</strong> ${participant.formula === 'with_meals' ? 'Met alle maaltijden (€20)' : 'Alleen ontbijt (€10)'}</p>
                <p><strong>Rit Type:</strong> ${participant.ride_type === 'guided' ? 'Begeleide rit' : 'Vrije rit'}</p>
              </div>

              <div class="qr-code">
                <h3>🎫 Jouw Check-in QR Code</h3>
                <p>Bewaar deze QR code - je hebt hem nodig op de dag van het evenement!</p>
                ${participant.qr_code_image_url ? `<img src="${participant.qr_code_image_url}" alt="QR Code" />` : `<p>QR code wordt binnenkort gegenereerd</p>`}
                <p style="font-size: 12px; color: #6b7280;">Of check in via: <a href="${checkInUrl}">${checkInUrl}</a></p>
              </div>

              <div class="info-box">
                <h3>📅 Belangrijke Informatie</h3>
                <p><strong>Datum:</strong> Vrijdag 16 mei 2026</p>
                <p><strong>Start:</strong> 06:30 - Café Den Belami, Aalter</p>
                <p><strong>Finish:</strong> Baraque de Fraiture (verwacht rond 21:00)</p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.PUBLIC_URL || 'https://deurdenbocht.be'}/dashboard" class="button">
                  Ga naar Dashboard
                </a>
              </div>

              <p>In je dashboard vind je:</p>
              <ul>
                <li>✅ Jouw registratiegegevens</li>
                <li>🗺️ GPX routes</li>
                <li>📖 Het bochtenboek</li>
                <li>📄 Alle documenten en instructies</li>
                <li>🏁 Rally zone informatie</li>
              </ul>

              <div class="footer">
                <p>Vragen? Contacteer ons via vzwddb@gmail.com</p>
                <p>© 2026 Deur Den Bocht - Een onvergetelijke motordag!</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function paymentConfirmationEmail(participant: {
  first_name: string;
  last_name: string;
  email: string;
  amount_paid: number;
  formula: string;
  payment_intent_id?: string;
}) {
  return {
    subject: '💰 Betaling Bevestigd - Deur Den Bocht 2026',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #d1fae5; border: 2px solid #059669; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .invoice { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Betaling Ontvangen!</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2 style="color: #059669; margin: 0;">€${participant.amount_paid.toFixed(2)}</h2>
                <p style="margin: 10px 0 0 0;">Betaling succesvol verwerkt</p>
              </div>

              <p>Beste ${participant.first_name} ${participant.last_name},</p>
              
              <p>Je betaling is succesvol ontvangen en verwerkt. Je bent nu volledig ingeschreven voor Deur Den Bocht 2026!</p>

              <div class="invoice">
                <h3>🧾 Betalingsdetails</h3>
                <table style="width: 100%; margin-top: 10px;">
                  <tr>
                    <td><strong>Bedrag:</strong></td>
                    <td style="text-align: right;">€${participant.amount_paid.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><strong>Formule:</strong></td>
                    <td style="text-align: right;">${participant.formula === 'with_meals' ? 'Met alle maaltijden' : 'Alleen ontbijt'}</td>
                  </tr>
                  ${participant.payment_intent_id ? `
                  <tr>
                    <td><strong>Referentie:</strong></td>
                    <td style="text-align: right; font-size: 12px;">${participant.payment_intent_id}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td style="text-align: right; color: #059669;"><strong>✓ Betaald</strong></td>
                  </tr>
                </table>
              </div>

              <p><strong>Volgende stappen:</strong></p>
              <ol>
                <li>Bewaar je QR code (zie eerdere email)</li>
                <li>Check je dashboard voor routes en documenten</li>
                <li>Bereid je motor voor</li>
                <li>Zie je op 16 mei 2026!</li>
              </ol>

              <div class="footer">
                <p>Dit is je bevestiging - geen actie vereist</p>
                <p>© 2026 Deur Den Bocht</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function rallySubmissionEmail(participant: {
  first_name: string;
  last_name: string;
  email: string;
  total_points: number;
  zones_completed: number;
  total_distance: number;
  rank?: number;
}) {
  return {
    subject: '🏁 Rally Inzending Ontvangen - Deur Den Bocht 2026',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { background: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; border: 2px solid #7c3aed; }
            .stat-value { font-size: 32px; font-weight: bold; color: #7c3aed; margin: 10px 0; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Rally Inzending Ontvangen!</h1>
            </div>
            <div class="content">
              <p>Beste ${participant.first_name} ${participant.last_name},</p>
              
              <p>Je rally inzending is succesvol ontvangen en verwerkt. Goed gedaan! 🏍️</p>

              <div class="stats">
                <div class="stat-box">
                  <div>🏆</div>
                  <div class="stat-value">${participant.total_points}</div>
                  <div>Punten</div>
                </div>
                <div class="stat-box">
                  <div>🎯</div>
                  <div class="stat-value">${participant.zones_completed}/8</div>
                  <div>Zones</div>
                </div>
                <div class="stat-box">
                  <div>🛣️</div>
                  <div class="stat-value">${participant.total_distance}</div>
                  <div>KM</div>
                </div>
              </div>

              ${participant.rank ? `
              <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h3 style="color: #f59e0b; margin: 0;">🏅 Huidige Positie: #${participant.rank}</h3>
              </div>
              ` : ''}

              <p>Je kunt je resultaten en de volledige leaderboard bekijken in je dashboard.</p>

              <div style="text-align: center;">
                <a href="${process.env.PUBLIC_URL || 'https://deurdenbocht.be'}/dashboard" class="button">
                  Bekijk Leaderboard
                </a>
              </div>

              <p><strong>Wat nu?</strong></p>
              <ul>
                <li>✅ Bekijk je positie op de leaderboard</li>
                <li>📊 Zie gedetailleerde statistieken</li>
                <li>🏆 Check wanneer winnaars bekend worden gemaakt</li>
                <li>📸 Deel je ervaring op social media!</li>
              </ul>

              <div class="footer">
                <p>Bedankt voor je deelname aan Deur Den Bocht 2026!</p>
                <p>© 2026 Deur Den Bocht</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function eventReminderEmail(participant: {
  first_name: string;
  last_name: string;
  email: string;
  formula: string;
  ride_type: string;
}, daysUntil: number) {
  return {
    subject: `⏰ ${daysUntil === 1 ? 'Morgen' : `Over ${daysUntil} dagen`} - Deur Den Bocht 2026!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ea580c; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .countdown { background: #fed7aa; border: 3px solid #ea580c; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .countdown-number { font-size: 72px; font-weight: bold; color: #ea580c; margin: 0; }
            .checklist { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 ${daysUntil === 1 ? 'Het is bijna zover!' : 'Nog even geduld!'}</h1>
            </div>
            <div class="content">
              <div class="countdown">
                <p style="margin: 0; font-size: 18px; color: #ea580c;">Nog maar</p>
                <div class="countdown-number">${daysUntil}</div>
                <p style="margin: 0; font-size: 18px; color: #ea580c;">${daysUntil === 1 ? 'DAG' : 'DAGEN'}</p>
              </div>

              <p>Beste ${participant.first_name},</p>
              
              <p>${daysUntil === 1 ? 'Morgen is het eindelijk zover!' : `Over ${daysUntil} dagen is het zover!`} Deur Den Bocht 2026 staat voor de deur. Ben je er klaar voor? 🏍️</p>

              <div class="checklist">
                <h3>✅ Laatste Checklist</h3>
                <ul style="list-style: none; padding: 0;">
                  <li>☐ Motor getankt en klaar</li>
                  <li>☐ QR code bewaard (check je email of dashboard)</li>
                  <li>☐ GPX route gedownload</li>
                  <li>☐ Bochtenboek bekeken</li>
                  <li>☐ Telefoon opgeladen</li>
                  <li>☐ ${participant.formula === 'with_meals' ? 'Lekker uitslapen - maaltijden zijn inclusief!' : 'Ontbijt is inclusief - kom met lege maag!'}</li>
                </ul>
              </div>

              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📍 Verzamelpunt:</strong> Café Den Belami, Aalter</p>
                <p style="margin: 5px 0 0 0;"><strong>⏰ Start:</strong> 06:30 uur - Wees op tijd!</p>
              </div>

              <p><strong>Wat te verwachten:</strong></p>
              <ul>
                <li>🗺️ ${participant.ride_type === 'guided' ? 'Je rijdt mee in een begeleide groep' : 'Je rijdt je eigen tempo'}</li>
                <li>🎯 8 rally zones om te ontdekken</li>
                <li>🏞️ 500+ km door prachtige landschappen</li>
                <li>🏁 Finish aan de Baraque de Fraiture</li>
              </ul>

              <div class="footer">
                <p>Veel rijplezier en tot ${daysUntil === 1 ? 'morgen' : 'snel'}!</p>
                <p>© 2026 Deur Den Bocht</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function criticalEventNotification(participant: {
  first_name: string;
  last_name: string;
  email: string;
}, event: {
  title: string;
  description: string;
  type: string;
}) {
  const typeEmoji: Record<string, string> = {
    closure: '🚧',
    accident: '🚨',
    flood: '🌊',
    warning: '⚠️',
  };

  return {
    subject: `🚨 URGENT - ${event.title} - Deur Den Bocht`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fee2e2; border: 3px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 BELANGRIJKE MELDING</h1>
            </div>
            <div class="content">
              <p>Beste ${participant.first_name},</p>

              <div class="alert-box">
                <h2 style="margin: 0 0 10px 0; color: #dc2626;">${typeEmoji[event.type] || '⚠️'} ${event.title}</h2>
                <p style="margin: 0; font-size: 16px;">${event.description}</p>
              </div>

              <p><strong>Let op tijdens je rit en volg de instructies.</strong></p>

              <p>Check de <a href="${process.env.PUBLIC_URL || 'https://deurdenbocht.be'}/live-map" style="color: #dc2626;">live map</a> voor meer details en updates.</p>

              <div class="footer">
                <p>Veiligheid eerst - Rijd voorzichtig!</p>
                <p>© 2026 Deur Den Bocht</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
