-- Insert test check-in data for rally zones
-- This creates sample participant check-ins with GPS data for visualization

-- Note: These inserts assume participant IDs exist. Adjust participant_id values as needed.

-- RZ1: Vlaamse Ardennen – Schelde (Eeklo area)
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-1', '1', 50.9541, 3.9986, 18.5,
  50.9535, 3.9995, 22.3, NOW(), NOW()
);

-- RZ2: 's-Gravenbrakel – Henegouwen Domain
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-2', '2', 50.8044, 3.8824, 15.2,
  50.8052, 3.8835, 19.8, NOW(), NOW()
);

-- RZ3: Charleroi/Thuin – Samber
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-3', '3', 50.4102, 4.4046, 25.1,
  50.4095, 4.4065, 20.5, NOW(), NOW()
);

-- RZ4: Dinant – Maas (Meuse)
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-1', '4', 50.2607, 4.9212, 16.8,
  50.2615, 4.9225, 21.2, NOW(), NOW()
);

-- RZ5: Revin – French Ardennes
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-2', '5', 50.0598, 4.5889, 23.7,
  50.0605, 4.5905, 24.1, NOW(), NOW()
);

-- RZ6: Bouillon – Semois
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-3', '6', 49.8019, 5.0698, 19.4,
  49.8025, 5.0712, 18.9, NOW(), NOW()
);

-- RZ7: Vielsalm – Plateau
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-1', '7', 50.4189, 5.9687, 17.3,
  50.4197, 5.9705, 20.7, NOW(), NOW()
);

-- RZ8: Baraque de Fraiture – Highest point
INSERT INTO rally_zone_submissions (
  participant_id, zone_id, entry_latitude, entry_longitude, entry_accuracy,
  answer_latitude, answer_longitude, answer_accuracy, answer_timestamp, created_at
) VALUES (
  'test-participant-2', '8', 50.4421, 6.0395, 21.5,
  50.4428, 6.0412, 23.2, NOW(), NOW()
);
