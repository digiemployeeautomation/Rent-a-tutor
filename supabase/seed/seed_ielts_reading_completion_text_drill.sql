-- ============================================================
-- Golden drill: completion (text) over one passage —
--   summary_completion (text_fill), summary_completion_wordlist
--   (single_select from a word list), note_completion (text_fill),
--   short_answer (text_fill).
-- text_fill: options { word_limit }, answer_key { accepted:[...], word_limit }.
-- ============================================================

DELETE FROM practice_items
WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'reading_set',
  'reading',
  'academic',
  6.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'Sleep and memory',
    'passage',
      'A. While we sleep, the brain is far from idle. During the deepest stage of sleep it replays the events of the day, strengthening the connections between the brain cells that store new memories. ' ||
      E'\n\n' ||
      'B. Researchers tested this by teaching volunteers a list of words and then either letting them sleep or keeping them awake. Those who slept remembered far more words the next morning. A short afternoon nap of around twenty minutes produced a smaller but still measurable benefit. ' ||
      E'\n\n' ||
      'C. Sleep also clears waste. A network of channels in the brain opens during sleep and flushes out proteins that build up while we are awake, which may help protect against later disease.'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — summary_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 'summary_completion',
 'Complete the summary: During the deepest stage of sleep, the brain ____ the events of the day. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["replays"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage uses the exact verb "replays".',
   'evidence', 'Paragraph A: "it replays the events of the day".'
 ));

-- Q2 — summary_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2, 'summary_completion',
 'Complete the summary: Sleep strengthens the ____ between brain cells. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["connections", "connection"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says sleep strengthens the connections between brain cells.',
   'evidence', 'Paragraph A: "strengthening the connections between the brain cells".'
 ));

-- Q3 — summary_completion_wordlist (single_select from a word list)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, 'summary_completion_wordlist',
 'Complete the summary using the list of words: During sleep, a network of ____ opens and removes harmful proteins.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. waste'),
   jsonb_build_object('value', 'B', 'label', 'B. words'),
   jsonb_build_object('value', 'C', 'label', 'C. proteins'),
   jsonb_build_object('value', 'D', 'label', 'D. disease'),
   jsonb_build_object('value', 'E', 'label', 'E. channels')
 )),
 '{"value": "E"}'::jsonb,
 jsonb_build_object(
   'rationale', 'A network of channels opens during sleep to flush out proteins.',
   'evidence', 'Paragraph C: "A network of channels in the brain opens during sleep".'
 ));

-- Q4 — note_completion (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 4, 'note_completion',
 'Complete the note: Length of a helpful afternoon nap: about ____ minutes. (ONE WORD OR A NUMBER)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["twenty", "20"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage gives around twenty minutes for a measurable nap benefit.',
   'evidence', 'Paragraph B: "a short afternoon nap of around twenty minutes".'
 ));

-- Q5 — short_answer (text_fill)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 5, 'short_answer',
 'What does the brain flush out during sleep? (NO MORE THAN TWO WORDS)',
 jsonb_build_object('word_limit', 2),
 '{"accepted": ["proteins"], "word_limit": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'During sleep the brain flushes out proteins that build up while awake.',
   'evidence', 'Paragraph C: "flushes out proteins that build up while we are awake".'
 ));
