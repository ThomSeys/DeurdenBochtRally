import { supabase } from '~/lib/supabase.server';
import { generateParticipantCertificate, generateEventSummaryReport } from '~/lib/pdf-generator.server';

/**
 * Background worker to process report generation queue
 * This should be run as a cron job or background task
 */
export async function processReportQueue() {
  console.log('Processing report queue...');

  // Get pending reports
  const { data: pendingReports, error } = await supabase
    .from('report_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching pending reports:', error);
    return;
  }

  if (!pendingReports || pendingReports.length === 0) {
    console.log('No pending reports to process');
    return;
  }

  console.log(`Found ${pendingReports.length} pending reports`);

  for (const report of pendingReports) {
    try {
      // Mark as processing
      await supabase
        .from('report_queue')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', report.id);

      console.log(`Processing report ${report.id} (type: ${report.report_type})`);

      let pdfBuffer: Buffer;
      let fileName: string;

      if (report.report_type === 'individual') {
        // Generate individual participant certificate
        const { data: reportData } = await supabase
          .rpc('get_participant_report_data', { p_participant_id: report.participant_id });

        if (!reportData) {
          throw new Error('Failed to fetch participant data');
        }

        pdfBuffer = await generateParticipantCertificate(reportData);
        fileName = `certificate-${report.participant_id}-${Date.now()}.pdf`;
      } else if (report.report_type === 'summary') {
        // Generate event summary report
        // TODO: Gather comprehensive event data
        const eventData = {
          totalParticipants: 0,
          totalCheckins: 0,
          totalPhotos: 0,
          totalStories: 0,
          totalAchievements: 0,
        };

        pdfBuffer = await generateEventSummaryReport(eventData);
        fileName = `summary-report-${Date.now()}.pdf`;
      } else {
        throw new Error(`Unknown report type: ${report.report_type}`);
      }

      // Upload PDF to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

      const fileUrl = urlData.publicUrl;

      // Mark as completed
      await supabase
        .from('report_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_url: fileUrl,
        })
        .eq('id', report.id);

      // Add to report history
      await supabase.from('report_history').insert({
        report_type: report.report_type,
        file_url: fileUrl,
        file_size_bytes: pdfBuffer.length,
        participant_id: report.participant_id,
        generated_by: report.requested_by,
      });

      console.log(`Report ${report.id} completed successfully`);

      // TODO: Send notification email to requester
      // This would integrate with your email service
    } catch (error) {
      console.error(`Error processing report ${report.id}:`, error);

      // Mark as failed
      await supabase
        .from('report_queue')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', report.id);
    }
  }

  console.log('Report queue processing completed');
}

/**
 * Process scheduled reports
 * This should be run periodically (e.g., every hour)
 */
export async function processScheduledReports() {
  console.log('Processing scheduled reports...');

  // Get active scheduled reports that are due
  const { data: dueReports, error } = await supabase
    .from('scheduled_reports')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_at', new Date().toISOString());

  if (error) {
    console.error('Error fetching scheduled reports:', error);
    return;
  }

  if (!dueReports || dueReports.length === 0) {
    console.log('No scheduled reports due');
    return;
  }

  console.log(`Found ${dueReports.length} scheduled reports due`);

  for (const scheduledReport of dueReports) {
    try {
      // Create report queue entries
      if (scheduledReport.report_type === 'individual') {
        // Queue individual reports for all participants
        const { data: participants } = await supabase
          .from('participants')
          .select('id');

        if (participants) {
          for (const participant of participants) {
            await supabase.from('report_queue').insert({
              report_type: 'individual',
              participant_id: participant.id,
              requested_by: scheduledReport.created_by,
              status: 'pending',
            });
          }
        }
      } else {
        // Queue summary/analytics report
        await supabase.from('report_queue').insert({
          report_type: scheduledReport.report_type,
          requested_by: scheduledReport.created_by,
          status: 'pending',
        });
      }

      // Update scheduled report
      await supabase.rpc('update_scheduled_report_after_run', {
        p_scheduled_report_id: scheduledReport.id,
      });

      console.log(`Scheduled report ${scheduledReport.id} queued successfully`);
    } catch (error) {
      console.error(`Error processing scheduled report ${scheduledReport.id}:`, error);
    }
  }

  console.log('Scheduled reports processing completed');
}

// If this file is run directly, process the queue
if (require.main === module) {
  (async () => {
    await processReportQueue();
    await processScheduledReports();
    process.exit(0);
  })();
}
