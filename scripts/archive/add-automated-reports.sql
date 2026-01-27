-- Report queue table
CREATE TABLE IF NOT EXISTS report_queue (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('individual', 'summary', 'analytics')),
  participant_id INTEGER REFERENCES participants(id),
  requested_by INTEGER NOT NULL REFERENCES participants(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_queue_status ON report_queue(status);
CREATE INDEX IF NOT EXISTS idx_report_queue_participant ON report_queue(participant_id);

-- Scheduled reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('individual', 'summary', 'analytics')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'event_end')),
  email_list TEXT[] NOT NULL,
  created_by INTEGER NOT NULL REFERENCES participants(id),
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;

-- Report history table
CREATE TABLE IF NOT EXISTS report_history (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  participant_id INTEGER REFERENCES participants(id),
  generated_by INTEGER REFERENCES participants(id),
  scheduled_report_id INTEGER REFERENCES scheduled_reports(id),
  metadata JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_history_type ON report_history(report_type);
CREATE INDEX IF NOT EXISTS idx_report_history_participant ON report_history(participant_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated ON report_history(generated_at DESC);

-- RLS policies
ALTER TABLE report_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- Only admins can manage reports
CREATE POLICY "Admins can manage report queue"
  ON report_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage scheduled reports"
  ON scheduled_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Participants can view their own reports, admins can view all
CREATE POLICY "Users can view their own reports"
  ON report_history
  FOR SELECT
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert into report history
CREATE POLICY "Admins can insert report history"
  ON report_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_frequency TEXT,
  p_current_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      RETURN p_current_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_current_time + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN p_current_time + INTERVAL '1 month';
    ELSE
      RETURN NULL; -- event_end doesn't have a next run time
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set next_run_at on insert
CREATE OR REPLACE FUNCTION set_next_run_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_run_at := calculate_next_run_time(NEW.frequency);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_reports_set_next_run
  BEFORE INSERT ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_next_run_at();

-- Function to update scheduled report after run
CREATE OR REPLACE FUNCTION update_scheduled_report_after_run(
  p_scheduled_report_id INTEGER
)
RETURNS void AS $$
DECLARE
  v_frequency TEXT;
BEGIN
  SELECT frequency INTO v_frequency
  FROM scheduled_reports
  WHERE id = p_scheduled_report_id;
  
  UPDATE scheduled_reports
  SET
    last_run_at = NOW(),
    next_run_at = calculate_next_run_time(v_frequency, NOW()),
    updated_at = NOW()
  WHERE id = p_scheduled_report_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get participant report data
CREATE OR REPLACE FUNCTION get_participant_report_data(p_participant_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'participant', (
      SELECT json_build_object(
        'id', id,
        'name', name,
        'email', email,
        'created_at', created_at
      )
      FROM participants
      WHERE id = p_participant_id
    ),
    'checkpoints', (
      SELECT json_agg(
        json_build_object(
          'checkpoint_number', checkpoint_number,
          'checked_in_at', checked_in_at,
          'latitude', latitude,
          'longitude', longitude
        ) ORDER BY checked_in_at
      )
      FROM checkins
      WHERE participant_id = p_participant_id
    ),
    'photos', (
      SELECT json_agg(
        json_build_object(
          'zone_id', zone_id,
          'photo_url', photo_url,
          'submitted_at', submitted_at
        ) ORDER BY submitted_at
      )
      FROM rally_photo_submissions
      WHERE participant_id = p_participant_id
    ),
    'stories', (
      SELECT json_agg(
        json_build_object(
          'title', title,
          'content', content,
          'likes', likes,
          'created_at', created_at
        ) ORDER BY created_at
      )
      FROM ride_stories
      WHERE participant_id = p_participant_id
    ),
    'achievements', (
      SELECT json_agg(
        json_build_object(
          'id', a.id,
          'name', a.name,
          'description', a.description,
          'badge_icon', a.badge_icon
        )
      )
      FROM achievements a
      WHERE p_participant_id = ANY(a.participants)
    ),
    'scores', (
      SELECT json_build_object(
        'total_checkpoints', COUNT(DISTINCT checkpoint_number),
        'total_zones_completed', (
          SELECT COUNT(DISTINCT zone_id)
          FROM rally_submissions
          WHERE participant_id = p_participant_id AND completed = true
        ),
        'total_photos', (
          SELECT COUNT(*)
          FROM rally_photo_submissions
          WHERE participant_id = p_participant_id
        ),
        'rhythm_score', (
          SELECT AVG(rhythm_score)
          FROM rally_submissions
          WHERE participant_id = p_participant_id AND rhythm_score IS NOT NULL
        )
      )
      FROM checkins
      WHERE participant_id = p_participant_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
