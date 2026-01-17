import { supabaseAdmin } from './supabase.server';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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
    rhythm_score: number | null;
  };
}

/**
 * Process pending reports in the queue
 */
export async function processReportQueue() {
  // Get pending reports
  const { data: pendingReports, error } = await (supabaseAdmin as any)
    .from('report_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(5);

  if (error || !pendingReports || pendingReports.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const report of pendingReports) {
    try {
      // Mark as processing
      await (supabaseAdmin as any)
        .from('report_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      let fileUrl: string;
      let metadata: any = {};

      if (report.report_type === 'individual') {
        const result = await generateIndividualReport(report.participant_id);
        fileUrl = result.fileUrl;
        metadata = result.metadata;
      } else if (report.report_type === 'summary') {
        const result = await generateSummaryReport();
        fileUrl = result.fileUrl;
        metadata = result.metadata;
      } else {
        throw new Error(`Unknown report type: ${report.report_type}`);
      }

      // Mark as completed
      await (supabaseAdmin as any)
        .from('report_queue')
        .update({
          status: 'completed',
          file_url: fileUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      // Add to report history
      await (supabaseAdmin as any)
        .from('report_history')
        .insert({
          report_type: report.report_type,
          file_url: fileUrl,
          participant_id: report.participant_id,
          generated_by: report.requested_by,
          metadata,
        });

      processed++;
    } catch (error) {
      console.error(`Error processing report ${report.id}:`, error);
      
      // Mark as failed
      await (supabaseAdmin as any)
        .from('report_queue')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', report.id);
    }
  }

  return { processed };
}

/**
 * Generate individual participant report
 */
async function generateIndividualReport(participantId: number | null) {
  if (!participantId) {
    throw new Error('Participant ID is required for individual reports');
  }

  console.log(`[Report Worker] Generating individual report for participant ${participantId}`);

  // Fetch participant data using the stored function
  const { data, error } = await (supabaseAdmin as any)
    .rpc('get_participant_report_data', { p_participant_id: participantId });

  if (error || !data) {
    console.error(`[Report Worker] Failed to fetch participant data:`, error);
    throw new Error(`Failed to fetch participant data: ${error?.message}`);
  }

  const reportData: ParticipantReportData = data;
  
  console.log(`[Report Worker] Participant data fetched:`, {
    name: reportData.participant?.name,
    checkpoints: reportData.checkpoints?.length || 0,
    photos: reportData.photos?.length || 0,
    stories: reportData.stories?.length || 0,
    achievements: reportData.achievements?.length || 0,
  });

  // Create PDF
  const pdfBuffer = await createIndividualPDF(reportData);
  console.log(`[Report Worker] Individual PDF created, size: ${pdfBuffer.length} bytes`);

  // Upload to Supabase Storage
  const fileName = `individual-report-${participantId}-${Date.now()}.pdf`;
  const { data: uploadData, error: uploadError } = await (supabaseAdmin as any)
    .storage
    .from('reports')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(`Failed to upload report: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = (supabaseAdmin as any)
    .storage
    .from('reports')
    .getPublicUrl(fileName);

  return {
    fileUrl: urlData.publicUrl,
    metadata: {
      participantId,
      participantName: reportData.participant.name,
      checkpoints: reportData.scores.total_checkpoints,
      photos: reportData.scores.total_photos,
    },
  };
}

/**
 * Generate summary report for all participants with complete data
 */
async function generateSummaryReport() {
  console.log('[Report Worker] Starting summary report generation...');
  
  // Fetch ALL participants with details - no limits, no date filters
  const { data: participants, error: participantsError } = await (supabaseAdmin as any)
    .from('participants')
    .select('id, first_name, last_name, email, created_at, is_admin, motorcycle_brand, motorcycle_model, license_plate')
    .order('created_at', { ascending: false });

  console.log(`[Report Worker] Fetched ${participants?.length || 0} participants`);
  if (participantsError) console.error('[Report Worker] Participants error:', participantsError);

  // Get ALL checkpoints with timestamps - no limits, no date filters
  const { data: allCheckpoints, error: checkpointsError } = await (supabaseAdmin as any)
    .from('rally_zone_submissions')
    .select('id, participant_id, checkpoint_number, entry_timestamp, entry_latitude, entry_longitude')
    .order('entry_timestamp', { ascending: true });

  console.log(`[Report Worker] Fetched ${allCheckpoints?.length || 0} checkpoints`);
  if (checkpointsError) console.error('[Report Worker] Checkpoints error:', checkpointsError);

  // Get ALL photos - no limits, no date filters
  const { data: allPhotos, error: photosError } = await (supabaseAdmin as any)
    .from('rally_zone_submissions')
    .select('id, participant_id, zone_id, proof_photo_url, created_at')
    .is('proof_photo_url', null, { negate: true })
    .order('created_at', { ascending: false });

  console.log(`[Report Worker] Fetched ${allPhotos?.length || 0} photos`);
  if (photosError) console.error('[Report Worker] Photos error:', photosError);

  // Get ALL stories - no limits, no date filters
  const { data: allStories, error: storiesError } = await (supabaseAdmin as any)
    .from('participant_photos')
    .select('id, participant_id, caption, location, likes_count, created_at')
    .order('likes_count', { ascending: false });

  console.log(`[Report Worker] Fetched ${allStories?.length || 0} stories`);
  if (storiesError) console.error('[Report Worker] Stories error:', storiesError);

  // Get ALL achievements - no limits
  const { data: allAchievements, error: achievementsError } = await (supabaseAdmin as any)
    .from('achievements')
    .select('*');

  console.log(`[Report Worker] Fetched ${allAchievements?.length || 0} achievements`);
  if (achievementsError) console.error('[Report Worker] Achievements error:', achievementsError);

  // Get ALL rally submissions - no limits, no date filters
  const { data: allSubmissions, error: submissionsError } = await (supabaseAdmin as any)
    .from('rally_submissions')
    .select('id, participant_id, total_points, shadow_total, submitted_at, short_zones_completed, medium_zones_completed, long_zones_completed')
    .order('submitted_at', { ascending: false });

  console.log(`[Report Worker] Fetched ${allSubmissions?.length || 0} submissions`);
  if (submissionsError) console.error('[Report Worker] Submissions error:', submissionsError);

  // Get ALL emergency alerts - no limits, no date filters
  // Note: Emergency SOS table doesn't exist in current schema, skipping for now
  const emergencyAlerts: any[] = [];
  const alertsError = null;

  console.log(`[Report Worker] Fetched ${emergencyAlerts?.length || 0} emergency alerts`);
  if (alertsError) console.error('[Report Worker] Alerts error:', alertsError);

  console.log(`[Report Worker] Fetched ${emergencyAlerts?.length || 0} emergency alerts`);
  if (alertsError) console.error('[Report Worker] Alerts error:', alertsError);

  // Calculate detailed statistics
  const checkpointsByParticipant = new Map();
  const photosByParticipant = new Map();
  const storiesByParticipant = new Map();

  allCheckpoints?.forEach((c: any) => {
    if (!checkpointsByParticipant.has(c.participant_id)) {
      checkpointsByParticipant.set(c.participant_id, []);
    }
    checkpointsByParticipant.get(c.participant_id).push(c);
  });

  allPhotos?.forEach((p: any) => {
    if (!photosByParticipant.has(p.participant_id)) {
      photosByParticipant.set(p.participant_id, []);
    }
    photosByParticipant.get(p.participant_id).push(p);
  });

  allStories?.forEach((s: any) => {
    if (!storiesByParticipant.has(s.participant_id)) {
      storiesByParticipant.set(s.participant_id, []);
    }
    storiesByParticipant.get(s.participant_id).push(s);
  });

  console.log(`[Report Worker] Aggregated data by participant:`, {
    checkpoints: checkpointsByParticipant.size,
    photos: photosByParticipant.size,
    stories: storiesByParticipant.size,
  });

  const summaryData = {
    totalParticipants: participants?.length || 0,
    participants: participants || [],
    totalCheckpoints: allCheckpoints?.length || 0,
    uniqueCheckpointParticipants: checkpointsByParticipant.size,
    totalPhotos: allPhotos?.length || 0,
    totalStories: allStories?.length || 0,
    totalAchievements: allAchievements?.length || 0,
    totalSubmissions: allSubmissions?.length || 0,
    completedSubmissions: allSubmissions?.filter((s: any) => s.submitted_at).length || 0,
    totalEmergencyAlerts: emergencyAlerts?.length || 0,
    resolvedEmergencyAlerts: emergencyAlerts?.filter((a: any) => a.resolved).length || 0,
    generatedAt: new Date().toISOString(),
    topCheckpointCollectors: Array.from(checkpointsByParticipant.entries())
      .map(([id, checkpoints]: [any, any]) => ({
        participantId: id,
        count: checkpoints.length,
        participant: participants?.find((p: any) => p.id === id),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topPhotoContributors: Array.from(photosByParticipant.entries())
      .map(([id, photos]: [any, any]) => ({
        participantId: id,
        count: photos.length,
        participant: participants?.find((p: any) => p.id === id),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topStoryWriters: Array.from(storiesByParticipant.entries())
      .map(([id, stories]: [any, any]) => ({
        participantId: id,
        count: stories.length,
        totalLikes: stories.reduce((sum: number, s: any) => sum + (s.likes_count || 0), 0),
        participant: participants?.find((p: any) => p.id === id),
      }))
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 10),
    allStories: allStories || [],
    allCheckpoints: allCheckpoints || [],
    allPhotos: allPhotos || [],
    emergencyAlerts: emergencyAlerts || [],
  };

  console.log(`[Report Worker] Summary data prepared:`, {
    totalParticipants: summaryData.totalParticipants,
    totalCheckpoints: summaryData.totalCheckpoints,
    totalPhotos: summaryData.totalPhotos,
    totalStories: summaryData.totalStories,
  });

  // Create comprehensive PDF
  const pdfBuffer = await createSummaryPDF(summaryData);
  console.log(`[Report Worker] PDF created, size: ${pdfBuffer.length} bytes`);

  // Upload to Supabase Storage
  const fileName = `summary-report-${Date.now()}.pdf`;
  const { data: uploadData, error: uploadError } = await (supabaseAdmin as any)
    .storage
    .from('reports')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(`Failed to upload report: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = (supabaseAdmin as any)
    .storage
    .from('reports')
    .getPublicUrl(fileName);

  return {
    fileUrl: urlData.publicUrl,
    metadata: {
      totalParticipants: summaryData.totalParticipants,
      totalCheckpoints: summaryData.totalCheckpoints,
      totalPhotos: summaryData.totalPhotos,
      totalStories: summaryData.totalStories,
    },
  };
}

/**
 * Create individual participant PDF with ALL data
 */
async function createIndividualPDF(data: ParticipantReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let currentPage = 1;

    // Helper function to add new page with header
    const addNewPage = () => {
      // Add footer to current page before moving to next
      doc.fontSize(8).fillColor('#999').text(
        `Deur Den Bocht 2026 - Gegenereerd op ${new Date().toLocaleString('nl-NL')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      doc.addPage();
      currentPage++;
      doc.fontSize(8).fillColor('#999').text(`${data.participant.first_name} ${data.participant.last_name} - Pagina ${currentPage}`, 50, 30, { align: 'right' });
      doc.moveDown(2);
    };

    // Helper to check if we need a new page
    const checkSpace = (needed: number) => {
      if (doc.y + needed > doc.page.height - 80) {
        addNewPage();
      }
    };

    // Header - Page 1
    doc.fontSize(24).fillColor('#2f7184').text('Deelnemersrapport', { align: 'center' });
    doc.moveDown(0.5);
    const fullName = `${data.participant.first_name} ${data.participant.last_name}`;
    doc.fontSize(18).fillColor('#333').text(fullName, { align: 'center' });
    doc.fontSize(10).fillColor('#666').text(data.participant.email, { align: 'center' });
    doc.fontSize(9).fillColor('#999').text(
      `Aangemeld: ${new Date(data.participant.created_at).toLocaleString('nl-NL')}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Executive Summary
    doc.fontSize(16).fillColor('#2f7184').text('Samenvatting');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#333');
    doc.text(`- Checkpoints: ${data.scores.total_checkpoints}`);
    doc.text(`- Zones voltooid: ${data.scores.total_zones_completed}`);
    doc.text(`- Foto's ingediend: ${data.scores.total_photos}`);
    doc.text(`- Verhalen geschreven: ${data.stories?.length || 0}`);
    doc.text(`- Achievements behaald: ${data.achievements?.length || 0}`);
    if (data.scores.rhythm_score) {
      doc.text(`- Gemiddelde ritme score: ${data.scores.rhythm_score.toFixed(2)}`);
    }
    doc.moveDown(2);

    // ALL Checkpoints
    if (data.checkpoints && data.checkpoints.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text('Alle Checkpoints');
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#333');
      
      data.checkpoints.forEach((checkpoint, i) => {
        checkSpace(25);
        const date = new Date(checkpoint.checked_in_at).toLocaleString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc.text(
          `${i + 1}. Checkpoint ${checkpoint.checkpoint_number} - ${date}`,
          { continued: true }
        );
        doc.fillColor('#666').text(` (${checkpoint.latitude.toFixed(5)}, ${checkpoint.longitude.toFixed(5)})`);
        doc.fillColor('#333');
      });
      doc.moveDown(2);
    }

    // ALL Photos with details
    if (data.photos && data.photos.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text('Alle Foto\'s');
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#333');
      
      data.photos.forEach((photo, i) => {
        checkSpace(35);
        const date = new Date(photo.submitted_at).toLocaleString('nl-NL');
        doc.text(`${i + 1}. Zone ${photo.zone_id}`);
        doc.fontSize(8).fillColor('#666').text(`   Ingediend: ${date}`);
        doc.text(`   URL: ${photo.photo_url.substring(0, 60)}...`);
        doc.fontSize(9).fillColor('#333');
        doc.moveDown(0.3);
      });
      doc.moveDown(2);
    }

    // ALL Achievements with full descriptions
    if (data.achievements && data.achievements.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text('Achievements Behaald');
      doc.moveDown(0.5);
      
      data.achievements.forEach((achievement) => {
        checkSpace(50);
        doc.fontSize(12).fillColor('#2f7184').text(`${achievement.badge_icon} ${achievement.name}`);
        doc.fontSize(10).fillColor('#333').text(achievement.description, { indent: 20 });
        doc.fontSize(8).fillColor('#666').text(`ID: ${achievement.id}`, { indent: 20 });
        doc.moveDown(0.8);
      });
      doc.moveDown(2);
    }

    // ALL Stories with full content
    if (data.stories && data.stories.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text('Alle Verhalen');
      doc.moveDown(0.5);
      
      data.stories.forEach((story, i) => {
        checkSpace(80);
        doc.fontSize(12).fillColor('#2f7184').text(`${i + 1}. ${story.title}`);
        doc.fontSize(8).fillColor('#666').text(
          new Date(story.created_at).toLocaleString('nl-NL'),
          { indent: 20 }
        );
        doc.fontSize(10).fillColor('#333');
        
        // Split content into lines to avoid overflow
        const contentLines = story.content.match(/.{1,80}(\s|$)/g) || [story.content];
        contentLines.forEach(line => {
          checkSpace(15);
          doc.text(line.trim(), { indent: 20 });
        });
        
        doc.fontSize(9).fillColor('#e74c3c').text(`${story.likes} likes`, { indent: 20 });
        doc.fillColor('#333');
        doc.moveDown(1.5);
      });
    }

    // Footer on last page
    doc.fontSize(8).fillColor('#999').text(
      `Deur Den Bocht 2026 - Gegenereerd op ${new Date().toLocaleString('nl-NL')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
  });
}

/**
 * Create comprehensive summary PDF with ALL data
 */
async function createSummaryPDF(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let currentPage = 1;

    // Helper function to add new page with header
    const addNewPage = () => {
      // Add footer to current page before moving to next
      doc.fontSize(8).fillColor('#999').text(
        `Deur Den Bocht 2026 - Volledige Evenement Analyse`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      doc.addPage();
      currentPage++;
      doc.fontSize(8).fillColor('#999').text(`Evenement Samenvatting - Pagina ${currentPage}`, 50, 30, { align: 'right' });
      doc.moveDown(2);
    };

    // Helper to check if we need a new page
    const checkSpace = (needed: number) => {
      if (doc.y + needed > doc.page.height - 80) {
        addNewPage();
      }
    };

    // Header - Page 1
    doc.fontSize(24).fillColor('#2f7184').text('Evenement Samenvattingsrapport', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#666').text('Deur Den Bocht 2026', { align: 'center' });
    doc.fontSize(10).fillColor('#999').text(
      new Date(data.generatedAt).toLocaleString('nl-NL'),
      { align: 'center' }
    );
    doc.moveDown(2);

    // Executive Summary
    doc.fontSize(18).fillColor('#2f7184').text('Kernstatistieken');
    doc.moveDown(1);

    const coreStats = [
      { label: 'Totaal Deelnemers', value: data.totalParticipants },
      { label: 'Totaal Checkpoint Scans', value: data.totalCheckpoints },
      { label: 'Unieke Actieve Deelnemers', value: data.uniqueCheckpointParticipants },
      { label: 'Totaal Foto\'s Ingediend', value: data.totalPhotos },
      { label: 'Totaal Verhalen', value: data.totalStories },
      { label: 'Rally Submissions', value: data.totalSubmissions },
      { label: 'Voltooide Zones', value: data.completedSubmissions },
      { label: 'Emergency Alerts', value: data.totalEmergencyAlerts },
      { label: 'Opgeloste Alerts', value: data.resolvedEmergencyAlerts },
    ];

    doc.fontSize(11).fillColor('#333');
    coreStats.forEach((stat) => {
      checkSpace(20);
      doc.text(`${stat.label}:`, { continued: true });
      doc.fillColor('#2f7184').fontSize(12).text(` ${stat.value.toLocaleString('nl-NL')}`, { align: 'right' });
      doc.fillColor('#333').fontSize(11);
      doc.moveDown(0.3);
    });

    doc.moveDown(2);

    // Engagement Metrics
    checkSpace(120);
    doc.fontSize(18).fillColor('#2f7184').text('Engagement Analyse');
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#333');

    if (data.totalParticipants > 0) {
      const participationRate = ((data.uniqueCheckpointParticipants / data.totalParticipants) * 100).toFixed(1);
      const avgCheckpointsPerParticipant = (data.totalCheckpoints / data.uniqueCheckpointParticipants || 0).toFixed(1);
      const avgPhotosPerParticipant = (data.totalPhotos / data.totalParticipants || 0).toFixed(1);
      const avgStoriesPerParticipant = (data.totalStories / data.totalParticipants || 0).toFixed(1);

      doc.text(`Deelname Ratio: ${participationRate}%`);
      doc.text(`Gemiddeld Checkpoints per Actieve Deelnemer: ${avgCheckpointsPerParticipant}`);
      doc.text(`Gemiddeld Foto's per Deelnemer: ${avgPhotosPerParticipant}`);
      doc.text(`Gemiddeld Verhalen per Deelnemer: ${avgStoriesPerParticipant}`);
    }
    doc.moveDown(2);

    // Top Performers - Checkpoints
    if (data.topCheckpointCollectors && data.topCheckpointCollectors.length > 0) {
      checkSpace(150);
      doc.fontSize(16).fillColor('#2f7184').text('Top Checkpoint Verzamelaars');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333');

      data.topCheckpointCollectors.forEach((entry: any, i: number) => {
        checkSpace(20);
        const name = entry.participant ? `${entry.participant.first_name} ${entry.participant.last_name}` : `Deelnemer ${entry.participantId}`;
        doc.text(`${i + 1}. ${name}`, { continued: true });
        doc.fillColor('#2f7184').text(` - ${entry.count} checkpoints`, { align: 'right' });
        doc.fillColor('#333');
      });
      doc.moveDown(2);
    }

    // Top Performers - Photos
    if (data.topPhotoContributors && data.topPhotoContributors.length > 0) {
      checkSpace(150);
      doc.fontSize(16).fillColor('#2f7184').text('Top Foto Bijdragers');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333');

      data.topPhotoContributors.forEach((entry: any, i: number) => {
        checkSpace(20);
        const name = entry.participant ? `${entry.participant.first_name} ${entry.participant.last_name}` : `Deelnemer ${entry.participantId}`;
        doc.text(`${i + 1}. ${name}`, { continued: true });
        doc.fillColor('#2f7184').text(` - ${entry.count} foto's`, { align: 'right' });
        doc.fillColor('#333');
      });
      doc.moveDown(2);
    }

    // Top Performers - Stories
    if (data.topStoryWriters && data.topStoryWriters.length > 0) {
      checkSpace(150);
      doc.fontSize(16).fillColor('#2f7184').text('Top Verhaal Schrijvers');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333');

      data.topStoryWriters.forEach((entry: any, i: number) => {
        checkSpace(20);
        const name = entry.participant ? `${entry.participant.first_name} ${entry.participant.last_name}` : `Deelnemer ${entry.participantId}`;
        doc.text(`${i + 1}. ${name}`, { continued: true });
        doc.fillColor('#2f7184').text(` - ${entry.count} verhalen (${entry.totalLikes} ❤️)`, { align: 'right' });
        doc.fillColor('#333');
      });
      doc.moveDown(2);
    }

    // All Participants List
    if (data.participants && data.participants.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text('Alle Deelnemers');
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#333');

      data.participants.forEach((p: any, i: number) => {
        checkSpace(18);
        const date = new Date(p.created_at).toLocaleDateString('nl-NL');
        const fullName = `${p.first_name} ${p.last_name}`;
        const role = p.is_admin ? 'admin' : 'participant';
        const motorcycle = p.motorcycle_brand && p.motorcycle_model ? `${p.motorcycle_brand} ${p.motorcycle_model}` : 'Niet ingevuld';
        doc.text(`${i + 1}. ${fullName} (${p.email}) - ${role} - ${p.license_plate || 'N/A'}`);
        doc.fontSize(7).fillColor('#666').text(`   Aangemeld: ${date} | Motor: ${motorcycle}`, { indent: 15 });
        doc.fontSize(8).fillColor('#333');
      });
      doc.moveDown(2);
    }

    // Most Liked Stories - SHOW ALL
    if (data.allStories && data.allStories.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text(`Alle Verhalen (${data.allStories.length})`);
      doc.moveDown(0.5);

      data.allStories.forEach((story: any, i: number) => {
        checkSpace(50);
        const title = story.caption || 'Zonder titel';
        const content = story.location || 'Geen locatie';
        doc.fontSize(11).fillColor('#2f7184').text(`${i + 1}. ${title}`);
        doc.fontSize(8).fillColor('#666').text(`Door deelnemer ${story.participant_id} - ${new Date(story.created_at).toLocaleDateString('nl-NL')}`);
        doc.fontSize(9).fillColor('#333').text(`Locatie: ${content}`);
        doc.fillColor('#e74c3c').text(`${story.likes_count || 0} likes`);
        doc.fillColor('#333');
        doc.moveDown(0.8);
      });
      doc.moveDown(2);
    }

    // Emergency Alerts - SHOW ALL
    if (data.emergencyAlerts && data.emergencyAlerts.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text(`Alle Emergency Alerts (${data.emergencyAlerts.length})`);
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#333');

      data.emergencyAlerts.forEach((alert: any, i: number) => {
        checkSpace(25);
        const date = new Date(alert.created_at).toLocaleString('nl-NL');
        const status = alert.resolved ? '✓ Opgelost' : '⚠ Open';
        doc.text(`${i + 1}. Deelnemer ${alert.participant_id} - ${date}`);
        doc.fontSize(8).fillColor('#666').text(`   Locatie: (${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}) - Status: ${status}`);
        doc.fontSize(9).fillColor('#333');
      });
      doc.moveDown(2);
    }

    // Checkpoint Timeline - SHOW ALL
    if (data.allCheckpoints && data.allCheckpoints.length > 0) {
      checkSpace(100);
      doc.fontSize(16).fillColor('#2f7184').text(`Volledige Checkpoint Tijdlijn (${data.allCheckpoints.length})`);
      doc.moveDown(0.5);
      doc.fontSize(7).fillColor('#333');

      data.allCheckpoints.forEach((checkpoint: any, i: number) => {
        checkSpace(15);
        const date = new Date(checkpoint.entry_timestamp).toLocaleString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc.text(`${date} - Deelnemer ${checkpoint.participant_id} @ CP${checkpoint.checkpoint_number}`);
      });
      doc.moveDown(2);
    }

    // Footer on last page
    doc.fontSize(8).fillColor('#999').text(
      `Deur Den Bocht 2026 - Volledige Evenement Analyse`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
  });
}
