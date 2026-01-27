-- Insert test check-in data for rally zones
-- Based on actual Belgian/French Ardennes locations

-- Sample participant IDs (using the two actual participants)
-- Participant 1: b00e83d5-69dc-4cff-b13d-19cf8d053729
-- Participant 2: 4a64f0ef-52ba-430f-a1f5-188bb958f473
-- Each participant will have entries in alternate zones to avoid unique constraint violations

-- RZ1: Vlaamse Ardennen – Schelde (Eeklo area)
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('b00e83d5-69dc-4cff-b13d-19cf8d053729', '1', 50.9541, 3.9986, 18.5, NOW(), 50.9535, 3.9995, 22.3, NOW(), 8.5, 7.2, 9.1, NOW());

-- RZ2: 's-Gravenbrakel – Henegouwen Domain
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('4a64f0ef-52ba-430f-a1f5-188bb958f473', '2', 50.8044, 3.8824, 15.2, NOW(), 50.8052, 3.8835, 19.8, NOW(), 7.8, 8.4, 8.7, NOW());

-- RZ3: Charleroi/Thuin – Samber
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('b00e83d5-69dc-4cff-b13d-19cf8d053729', '3', 50.4102, 4.4046, 25.1, NOW(), 50.4095, 4.4065, 20.5, NOW(), 9.2, 6.8, 7.5, NOW());

-- RZ4: Dinant – Maas (Meuse)
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('4a64f0ef-52ba-430f-a1f5-188bb958f473', '4', 50.2607, 4.9212, 16.8, NOW(), 50.2615, 4.9225, 21.2, NOW(), 8.9, 9.1, 8.3, NOW());

-- RZ5: Revin – French Ardennes
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('b00e83d5-69dc-4cff-b13d-19cf8d053729', '5', 50.0598, 4.5889, 23.7, NOW(), 50.0605, 4.5905, 24.1, NOW(), 7.5, 8.8, 9.4, NOW());

-- RZ6: Bouillon – Semois
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('4a64f0ef-52ba-430f-a1f5-188bb958f473', '6', 49.8019, 5.0698, 19.4, NOW(), 49.8025, 5.0712, 18.9, NOW(), 8.1, 7.9, 8.6, NOW());

-- RZ7: Vielsalm – Plateau
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('b00e83d5-69dc-4cff-b13d-19cf8d053729', '7', 50.4189, 5.9687, 17.3, NOW(), 50.4197, 5.9705, 20.7, NOW(), 9.0, 8.2, 7.8, NOW());

-- RZ8: Baraque de Fraiture – Highest point
INSERT INTO rally_zone_submissions (participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy, entry_timestamp, answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, rhythm_score, view_score, shadow_score, created_at)
VALUES 
  ('4a64f0ef-52ba-430f-a1f5-188bb958f473', '8', 50.4421, 6.0395, 21.5, NOW(), 50.4428, 6.0412, 23.2, NOW(), 8.7, 9.3, 8.9, NOW());
