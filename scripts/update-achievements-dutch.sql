-- Update achievements to Dutch translations
-- Run this to update existing English achievements to Dutch

UPDATE achievements SET title = 'Eerste Bloed', description = 'Voltooi je eerste rally zone' WHERE name = 'first_zone';
UPDATE achievements SET title = 'Halverwege Held', description = 'Voltooi 4 rally zones' WHERE name = 'half_complete';
UPDATE achievements SET title = 'Zone Meester', description = 'Voltooi alle 8 rally zones' WHERE name = 'all_zones';
UPDATE achievements SET title = 'Perfecte Score', description = 'Krijg alle rally zone antwoorden correct' WHERE name = 'perfect_score';
UPDATE achievements SET title = 'Vroege Vogel', description = 'Check in voor 07:00' WHERE name = 'early_bird';
UPDATE achievements SET title = 'Weerkrijger', description = 'Voltooi rally in slecht weer' WHERE name = 'weather_warrior';
UPDATE achievements SET title = 'Marathon Rijder', description = 'Rijd meer dan 550km' WHERE name = 'marathon_rider';
UPDATE achievements SET title = 'Sociale Vlinder', description = 'Upload 5 foto''s' WHERE name = 'social_butterfly';
UPDATE achievements SET title = 'Populair', description = 'Krijg 10 likes op je foto''s' WHERE name = 'popular';
UPDATE achievements SET title = 'Veteraan', description = 'Deelgenomen aan vorige edities' WHERE name = 'veteran';
