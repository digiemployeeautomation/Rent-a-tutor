-- supabase/seed/seed_curriculum.sql

-- Forms
INSERT INTO forms (level, name) VALUES
  (1, 'Form 1'),
  (2, 'Form 2'),
  (3, 'Form 3'),
  (4, 'Form 4')
ON CONFLICT (level) DO NOTHING;

-- Terms (3 per form)
INSERT INTO terms (form_id, number, name)
SELECT f.id, t.number, 'Term ' || t.number
FROM forms f
CROSS JOIN (VALUES (1), (2), (3)) AS t(number)
ON CONFLICT (form_id, number) DO NOTHING;

-- Subjects
INSERT INTO subjects_new (name, slug, description) VALUES
  ('Agricultural Science', 'agricultural-science', 'Agriculture in Zambia, soil science, crop and livestock production'),
  ('Biology', 'biology', 'Cellular life, organisms, evolution, and ecological relationships'),
  ('Chemistry', 'chemistry', 'Matter, chemical reactions, organic and inorganic chemistry'),
  ('Civic Education', 'civic-education', 'Governance, human rights, democracy, and civic responsibility'),
  ('English Language', 'english-language', 'Reading, writing, grammar, and communication skills'),
  ('Food and Nutrition', 'food-and-nutrition', 'Nutrition science, food preparation, and dietary health'),
  ('Geography', 'geography', 'Physical and human geography, map skills, and environmental studies'),
  ('History', 'history', 'Zambian and world history, political developments, and cultural heritage'),
  ('Mathematics', 'mathematics', 'Algebra, geometry, statistics, and mathematical reasoning'),
  ('Physical Education and Sport', 'physical-education', 'Physical fitness, sports skills, and health education'),
  ('Religious Education', 'religious-education', 'World religions, ethics, morality, and spiritual development')
ON CONFLICT (name) DO NOTHING;
