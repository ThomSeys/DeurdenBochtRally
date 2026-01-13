-- Populate test GPS data for rally zones
-- Based on actual Belgian/French Ardennes locations

-- RZ1: Vlaamse Ardennen – Schelde (Eeklo area)
UPDATE rally_zone_submissions 
SET entry_latitude = 50.9541, entry_longitude = 3.9986, entry_accuracy = 18.5
WHERE zone_id = '1' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 50.9535, answer_longitude = 3.9995, answer_accuracy = 22.3, answer_timestamp = NOW()
WHERE zone_id = '1' AND answer_latitude IS NULL;

-- RZ2: 's-Gravenbrakel – Henegouwen Domain
UPDATE rally_zone_submissions 
SET entry_latitude = 50.8044, entry_longitude = 3.8824, entry_accuracy = 15.2
WHERE zone_id = '2' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 50.8052, answer_longitude = 3.8835, answer_accuracy = 19.8, answer_timestamp = NOW()
WHERE zone_id = '2' AND answer_latitude IS NULL;

-- RZ3: Charleroi/Thuin – Samber
UPDATE rally_zone_submissions 
SET entry_latitude = 50.4102, entry_longitude = 4.4046, entry_accuracy = 25.1
WHERE zone_id = '3' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 50.4095, answer_longitude = 4.4065, answer_accuracy = 20.5, answer_timestamp = NOW()
WHERE zone_id = '3' AND answer_latitude IS NULL;

-- RZ4: Dinant – Maas (Meuse)
UPDATE rally_zone_submissions 
SET entry_latitude = 50.2607, entry_longitude = 4.9212, entry_accuracy = 16.8
WHERE zone_id = '4' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 50.2615, answer_longitude = 4.9225, answer_accuracy = 21.2, answer_timestamp = NOW()
WHERE zone_id = '4' AND answer_latitude IS NULL;

-- RZ5: Revin – French Ardennes
UPDATE rally_zone_submissions 
SET entry_latitude = 50.0598, entry_longitude = 4.5889, entry_accuracy = 23.7
WHERE zone_id = '5' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 50.0605, answer_longitude = 4.5905, answer_accuracy = 24.1, answer_timestamp = NOW()
WHERE zone_id = '5' AND answer_latitude IS NULL;

-- RZ6: Bouillon – Semois
UPDATE rally_zone_submissions 
SET entry_latitude = 49.8019, entry_longitude = 5.0698, entry_accuracy = 19.4
WHERE zone_id = '6' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 49.8025, answer_longitude = 5.0712, answer_accuracy = 18.9, answer_timestamp = NOW()
WHERE zone_id = '6' AND answer_latitude IS NULL;

-- RZ7: Vielsalm – Plateau
UPDATE rally_zone_submissions 
SET entry_latitude = 50.4189, entry_longitude = 5.9687, entry_accuracy = 17.3
WHERE zone_id = '7' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 50.4197, answer_longitude = 5.9705, answer_accuracy = 20.7, answer_timestamp = NOW()
WHERE zone_id = '7' AND answer_latitude IS NULL;

-- RZ8: Baraque de Fraiture – Highest point
UPDATE rally_zone_submissions 
SET entry_latitude = 50.4421, entry_longitude = 6.0395, entry_accuracy = 21.5
WHERE zone_id = '8' AND entry_latitude IS NULL;

UPDATE rally_zone_submissions 
SET answer_latitude = 50.4428, answer_longitude = 6.0412, answer_accuracy = 23.2, answer_timestamp = NOW()
WHERE zone_id = '8' AND answer_latitude IS NULL;
