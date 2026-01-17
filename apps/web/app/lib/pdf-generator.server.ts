import PDFDocument from 'pdfkit';

interface ParticipantReportData {
  participant: {
    id: number;
    name: string;
    email: string;
    created_at: string;
  };
  checkpoints: Array<{
    checkpoint_number: number;
    checked_in_at: string;
    latitude: number;
    longitude: number;
  }>;
  photos: Array<{
    zone_id: number;
    photo_url: string;
    submitted_at: string;
  }>;
  stories: Array<{
    title: string;
    content: string;
    likes: number;
    created_at: string;
  }>;
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    badge_icon: string;
  }>;
  scores: {
    total_checkpoints: number;
    total_zones_completed: number;
    total_photos: number;
    rhythm_score: number;
  };
}

export async function generateParticipantCertificate(
  data: ParticipantReportData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Header with event branding
      doc
        .fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#1a56db')
        .text('Deur Den Bocht 2026', { align: 'center' });

      doc.moveDown(0.5);
      doc
        .fontSize(24)
        .font('Helvetica')
        .fillColor('#374151')
        .text('Participant Certificate', { align: 'center' });

      doc.moveDown(1);

      // Decorative line
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#e5e7eb')
        .lineWidth(2)
        .stroke();

      doc.moveDown(2);

      // Participant name (prominent)
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text(data.participant.name, { align: 'center' });

      doc.moveDown(0.5);
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`Participant #${data.participant.id}`, { align: 'center' });

      doc.moveDown(2);

      // Achievements section
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1a56db')
        .text('Event Summary');

      doc.moveDown(0.5);

      const scoreBoxY = doc.y;
      const boxWidth = 120;
      const boxHeight = 80;
      const boxSpacing = 15;
      const startX = 50;

      // Score boxes
      const scores = [
        { label: 'Checkpoints', value: data.scores.total_checkpoints, color: '#10b981' },
        { label: 'Zones Completed', value: data.scores.total_zones_completed, color: '#3b82f6' },
        { label: 'Photos Shared', value: data.scores.total_photos, color: '#8b5cf6' },
        {
          label: 'Rhythm Score',
          value: data.scores.rhythm_score ? Math.round(data.scores.rhythm_score) : 0,
          color: '#f59e0b',
        },
      ];

      scores.forEach((score, index) => {
        const x = startX + (boxWidth + boxSpacing) * index;
        const y = scoreBoxY;

        // Box background
        doc
          .roundedRect(x, y, boxWidth, boxHeight, 8)
          .fillAndStroke(score.color + '20', score.color);

        // Value
        doc
          .fontSize(32)
          .font('Helvetica-Bold')
          .fillColor(score.color)
          .text(score.value.toString(), x, y + 15, {
            width: boxWidth,
            align: 'center',
          });

        // Label
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#374151')
          .text(score.label, x, y + 55, {
            width: boxWidth,
            align: 'center',
          });
      });

      doc.y = scoreBoxY + boxHeight + 30;

      // Achievements
      if (data.achievements && data.achievements.length > 0) {
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#1a56db')
          .text('Achievements Unlocked');

        doc.moveDown(0.5);

        data.achievements.forEach((achievement, index) => {
          if (index < 5) {
            // Limit to 5 achievements to fit on page
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .fillColor('#111827')
              .text(`• ${achievement.name}`, { indent: 20 });

            doc
              .fontSize(10)
              .font('Helvetica')
              .fillColor('#6b7280')
              .text(achievement.description, { indent: 35 });

            doc.moveDown(0.3);
          }
        });

        if (data.achievements.length > 5) {
          doc
            .fontSize(10)
            .font('Helvetica-Oblique')
            .fillColor('#6b7280')
            .text(`... and ${data.achievements.length - 5} more!`, { indent: 20 });
        }

        doc.moveDown(1);
      }

      // Stats breakdown
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1a56db')
        .text('Event Statistics');

      doc.moveDown(0.5);

      const stats = [
        {
          label: 'Total Checkpoints Visited',
          value: data.checkpoints?.length || 0,
        },
        {
          label: 'Photos Submitted',
          value: data.photos?.length || 0,
        },
        {
          label: 'Stories Shared',
          value: data.stories?.length || 0,
        },
        {
          label: 'Total Story Likes',
          value: data.stories?.reduce((sum, s) => sum + (s.likes || 0), 0) || 0,
        },
      ];

      stats.forEach((stat) => {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#374151')
          .text(`${stat.label}:`, 70, doc.y, { continued: true })
          .font('Helvetica-Bold')
          .text(` ${stat.value}`, { align: 'left' });

        doc.moveDown(0.3);
      });

      doc.moveDown(2);

      // Footer with date and signature
      const footerY = 700;
      doc.y = footerY;

      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`Certificate generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`, { align: 'center' });

      doc.moveDown(0.3);

      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('#9ca3af')
        .text('Thank you for participating in Deur Den Bocht 2026!', { align: 'center' });

      // Watermark
      doc
        .fontSize(60)
        .font('Helvetica-Bold')
        .fillColor('#f3f4f6')
        .opacity(0.1)
        .text('DEUR DEN BOCHT', 0, 400, {
          align: 'center',
          width: 595,
        });

      doc.end();
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}

export async function generateEventSummaryReport(
  eventData: any
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Header
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#1a56db')
        .text('Deur Den Bocht 2026', { align: 'center' });

      doc.moveDown(0.3);
      doc
        .fontSize(20)
        .font('Helvetica')
        .fillColor('#374151')
        .text('Event Summary Report', { align: 'center' });

      doc.moveDown(0.3);
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(
          `Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          { align: 'center' }
        );

      doc.moveDown(1);

      // Decorative line
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#e5e7eb')
        .lineWidth(2)
        .stroke();

      doc.moveDown(1.5);

      // Overview section
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#1a56db')
        .text('Event Overview');

      doc.moveDown(0.5);

      // TODO: Add actual event data when available
      const overviewStats = [
        { label: 'Total Participants', value: eventData?.totalParticipants || 0 },
        { label: 'Total Check-ins', value: eventData?.totalCheckins || 0 },
        { label: 'Photos Submitted', value: eventData?.totalPhotos || 0 },
        { label: 'Stories Shared', value: eventData?.totalStories || 0 },
        { label: 'Achievements Unlocked', value: eventData?.totalAchievements || 0 },
      ];

      overviewStats.forEach((stat) => {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#374151')
          .text(`${stat.label}:`, 70, doc.y, { continued: true })
          .font('Helvetica-Bold')
          .text(` ${stat.value}`, { align: 'left' });

        doc.moveDown(0.3);
      });

      doc.moveDown(1);

      // Top performers section
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#1a56db')
        .text('Top Performers');

      doc.moveDown(0.5);

      // Placeholder for top performers
      doc
        .fontSize(11)
        .font('Helvetica-Oblique')
        .fillColor('#6b7280')
        .text('Detailed performance metrics available in analytics dashboard');

      doc.end();
    } catch (error) {
      doc.end();
      reject(error);
    }
  });
}
