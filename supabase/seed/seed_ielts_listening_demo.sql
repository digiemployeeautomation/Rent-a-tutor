-- ============================================================
-- Seed: one published Academic Listening set for the demo, with 6
-- questions including a multi_select (mcq_multi, choose TWO) and two
-- text_fill completions (note_completion / table_completion).
--
-- Audio: payload.audio_path points at a real recording in the private
-- `practice-audio` bucket (served via a service-role signed URL). The
-- source MP3 and its script live in the repo at
-- content/audio/listening-section-1.{mp3,md}; this seed does NOT upload
-- the file, so after a fresh project re-upload it to
-- practice-audio/demo/listening-section-1.mp3 (contentType audio/mpeg).
-- payload.transcript (array of { speaker, text }) and
-- payload.duration_seconds match that recording; keep them in sync with
-- content/audio/listening-section-1.md if the audio is regenerated.
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
    'section', 1,
    'duration_seconds', 150,
    'transcript', '[
      {
        "speaker": "Narrator",
        "text": "You will hear a conversation between a woman who wants to join a community centre and a receptionist. First you have some time to look at questions 1 to 6."
      },
      {
        "speaker": "Narrator",
        "text": "Now listen carefully and answer questions 1 to 6."
      },
      {
        "speaker": "Receptionist",
        "text": "Good morning, Riverside Community Centre. How can I help you?"
      },
      {
        "speaker": "Caller",
        "text": "Hello. I''m thinking of joining the centre, and I''d like to ask about the pottery class. Is it still on Wednesday evenings?"
      },
      {
        "speaker": "Receptionist",
        "text": "It used to be on Wednesdays, but it moved last term. A lot of people asked for a weekend class, so now it''s on Saturday mornings, from ten until twelve."
      },
      {
        "speaker": "Caller",
        "text": "Saturday mornings. That''s actually better for me. And there''s nothing on Monday?"
      },
      {
        "speaker": "Receptionist",
        "text": "No, Monday is our painting group. Pottery is only on Saturdays now."
      },
      {
        "speaker": "Caller",
        "text": "Lovely. So what do I need to bring to my first session?"
      },
      {
        "speaker": "Receptionist",
        "text": "Two things. First, proof of address. A recent bank statement or a utility bill is fine. And second, the membership form, filled in and signed."
      },
      {
        "speaker": "Caller",
        "text": "Do I need a passport photo as well?"
      },
      {
        "speaker": "Receptionist",
        "text": "No, you don''t need a photo any more. We take your picture here when we print your card."
      },
      {
        "speaker": "Caller",
        "text": "And is there a deposit to pay?"
      },
      {
        "speaker": "Receptionist",
        "text": "No, there''s no deposit. And you don''t need a medical certificate either. That''s only for the swimming club."
      },
      {
        "speaker": "Caller",
        "text": "Great. How much is the membership fee?"
      },
      {
        "speaker": "Receptionist",
        "text": "It''s twelve pounds a month for students. Are you a student?"
      },
      {
        "speaker": "Caller",
        "text": "No, I''m not, I''m afraid."
      },
      {
        "speaker": "Receptionist",
        "text": "Then it''s fifteen pounds per month for adult members."
      },
      {
        "speaker": "Caller",
        "text": "Fifteen pounds a month. That''s reasonable. Is the centre open every day?"
      },
      {
        "speaker": "Receptionist",
        "text": "Almost. We''re open seven days a week, but we close on the first Monday of every month, for cleaning and repairs."
      },
      {
        "speaker": "Caller",
        "text": "The first Monday. I''ll remember that. I''m also interested in yoga. Where is that class held?"
      },
      {
        "speaker": "Receptionist",
        "text": "Yoga used to be in the Main Hall, but it was too noisy in there, so the class has moved to the Garden Hall, at the back of the building."
      },
      {
        "speaker": "Caller",
        "text": "The Garden Hall. And finally, when can I come in to enrol? I work during the week."
      },
      {
        "speaker": "Receptionist",
        "text": "That''s no problem. The enrolment desk is open at weekends as well, on Saturdays and Sundays, from nine until one."
      },
      {
        "speaker": "Caller",
        "text": "Perfect. I''ll come in on Saturday, then. Thank you very much."
      },
      {
        "speaker": "Receptionist",
        "text": "You''re welcome. Goodbye."
      },
      {
        "speaker": "Narrator",
        "text": "That is the end of the conversation."
      }
    ]'::jsonb
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
