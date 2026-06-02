-- ============================================================
-- Seed: one published Academic Listening set for the demo, with 6
-- questions including a multi_select (mcq_multi, choose TWO) and two
-- text_fill completions (note_completion / table_completion).
--
-- payload.audio_path is a placeholder — real TTS audio is produced in
-- Wave 3, and the file must exist in the private `practice-audio`
-- bucket for the signed URL to resolve. Until then the AudioPlayer
-- degrades gracefully to an "audio not available" state.
--
-- Idempotent: a fixed item UUID lets the questions FK it directly, and
-- the DELETE on that id (ON DELETE CASCADE) clears prior questions.
--
-- Column conventions (migrations 006/007):
--   options : single/multi-select → { "choices": [...] }, multi adds "max": N
--             text_fill           → { "word_limit": N }  (UI guidance only)
--   answer_key (server-only):
--             single_select → { "value": "B" }
--             multi_select  → { "values": ["A","C"], "required": 2 }
--             text_fill     → { "accepted": [...], "word_limit": N }
-- ============================================================

DELETE FROM practice_items
WHERE id = '22222222-2222-4222-8222-222222222222';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  'listening_set',
  'listening',
  'academic',
  6.0,
  '["listening"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'demo-listening-community-centre',
    'title', 'Community centre enrolment',
    'audio_path', 'demo/listening-section-1.mp3',
    'section', 1
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — mcq_single (single_select with options.choices)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('22222222-2222-4222-8222-222222222222', 1, 'mcq_single',
 'On which day does the pottery class take place?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. Monday'),
   jsonb_build_object('value', 'B', 'label', 'B. Wednesday'),
   jsonb_build_object('value', 'C', 'label', 'C. Saturday')
 )),
 '{"value": "C"}'::jsonb);

-- Q2 — mcq_multi (multi_select, choose TWO; options.max + answer_key.required)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('22222222-2222-4222-8222-222222222222', 2, 'mcq_multi',
 'Which TWO items must new members bring to their first session?',
 jsonb_build_object(
   'max', 2,
   'choices', jsonb_build_array(
     jsonb_build_object('value', 'A', 'label', 'A. proof of address'),
     jsonb_build_object('value', 'B', 'label', 'B. a passport photo'),
     jsonb_build_object('value', 'C', 'label', 'C. a deposit'),
     jsonb_build_object('value', 'D', 'label', 'D. a medical certificate'),
     jsonb_build_object('value', 'E', 'label', 'E. a membership form')
   )
 ),
 '{"values": ["A", "E"], "required": 2}'::jsonb);

-- Q3 — note_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('22222222-2222-4222-8222-222222222222', 3, 'note_completion',
 'Membership fee: £____ per month.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["15", "fifteen"], "word_limit": 1}'::jsonb);

-- Q4 — note_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('22222222-2222-4222-8222-222222222222', 4, 'note_completion',
 'The centre is closed on the first ____ of every month.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["monday"], "word_limit": 1}'::jsonb);

-- Q5 — table_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('22222222-2222-4222-8222-222222222222', 5, 'table_completion',
 'Yoga class — room: the ____ Hall.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["garden"], "word_limit": 1}'::jsonb);

-- Q6 — tfng (single_select, fixedOptions from the registry → options null)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key) VALUES
('22222222-2222-4222-8222-222222222222', 6, 'tfng',
 'The enrolment desk is open at weekends.',
 NULL,
 '{"value": "TRUE"}'::jsonb);
