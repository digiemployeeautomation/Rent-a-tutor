-- ============================================================
-- Seed: the worked Sentence completion module — a skill_lessons row
-- (the lesson) plus a single-type sentence_completion drill practice_item
-- (the test) whose questions carry explanations. Idempotent via fixed UUIDs.
--
-- Sentence completion is the gateway to the whole text_fill family
-- (note / summary / table / flow-chart / diagram completion): copy words
-- EXACTLY from the passage and obey the word limit.
--
-- Column conventions (migration 007):
--   options    (text_fill) : { "word_limit": N }  (UI guidance only)
--   answer_key (text_fill) : { "accepted": [...], "word_limit": N }  (server-only)
-- ============================================================

-- The drill practice_item (fixed id so the lesson can reference it).
DELETE FROM practice_items WHERE id = '55555555-5555-4555-8555-555555555555';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '55555555-5555-4555-8555-555555555555',
  'reading_set', 'reading', 'academic', 6.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'drill-sentence-completion',
    'title', 'Sentence completion — practice',
    'passage',
      'The Dead Sea, which borders Jordan and Israel, lies at the lowest point on the surface of the Earth, about 430 metres below sea level. ' ||
      'Its water is almost ten times saltier than ordinary seawater, which makes swimming difficult but floating effortless. ' ||
      E'\n\n' ||
      'The extreme salinity means that no fish can survive in the lake, a fact that gave the sea its name. ' ||
      'For centuries, visitors have travelled to its shores in the belief that the mineral-rich mud can soothe skin conditions. ' ||
      'In recent decades, however, the lake has been shrinking, mainly because the River Jordan, its principal source, is increasingly diverted for farming.',
    'minimum_reading_minutes', 7
  ),
  'published', 'seed-v1', now()
);

INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('55555555-5555-4555-8555-555555555555', 1, 'sentence_completion',
 'The surface of the Dead Sea sits about 430 metres below ____.',
 jsonb_build_object('word_limit', 2),
 '{"accepted": ["sea level"], "word_limit": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage gives the exact phrase "430 metres below sea level"; copy the words as written.',
   'evidence', 'Paragraph 1: "about 430 metres below sea level."'
 )),
('55555555-5555-4555-8555-555555555555', 2, 'sentence_completion',
 'Compared with ordinary seawater, the lake''s water is nearly ten times ____.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["saltier"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'One word, copied exactly: the passage says the water is "almost ten times saltier".',
   'evidence', 'Paragraph 1: "almost ten times saltier than ordinary seawater."',
   'distractors', jsonb_build_object('salty', 'The grammar of "ten times ____" needs the comparative "saltier", and that is the word the passage uses.')
 )),
('55555555-5555-4555-8555-555555555555', 3, 'sentence_completion',
 'No ____ are able to live in the lake because of the salt.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["fish"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says "no fish can survive in the lake"; the single word that fits is "fish".',
   'evidence', 'Paragraph 2: "no fish can survive in the lake."'
 )),
('55555555-5555-4555-8555-555555555555', 4, 'sentence_completion',
 'Visitors believe the mineral-rich ____ from the shore can soothe skin conditions.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["mud"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage credits the "mineral-rich mud" with soothing skin; the missing word is "mud".',
   'evidence', 'Paragraph 2: "the mineral-rich mud can soothe skin conditions."'
 )),
('55555555-5555-4555-8555-555555555555', 5, 'sentence_completion',
 'The lake is shrinking mainly because water from the River Jordan is diverted for ____.',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["farming", "agriculture"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage says the river is "increasingly diverted for farming"; "farming" copies the text (and "agriculture" is an accepted synonym).',
   'evidence', 'Paragraph 2: "the River Jordan ... is increasingly diverted for farming."'
 ));

-- The lesson (skill_lessons row), linked to the drill above.
DELETE FROM skill_lessons WHERE slug = 'reading-sentence-completion';

INSERT INTO skill_lessons (
  section, question_type, slug, title, summary, slides_data, drill_item_id, position, status, published_at
) VALUES (
  'reading', 'sentence_completion', 'reading-sentence-completion',
  'Sentence completion',
  'Fill the gaps with words taken straight from the passage — exactly, within the word limit, and grammatically.',
  jsonb_build_object('blocks', jsonb_build_array(
    jsonb_build_object(
      'tag', 'foundational',
      'title', 'What this question asks',
      'content', 'You complete a sentence using words FROM the passage. The same rules cover note, table, summary, flow-chart and diagram completion.',
      'bullets', jsonb_build_array(
        'Copy the word(s) exactly as they appear — do not change the form.',
        'Never write more than the word limit (e.g. "ONE WORD AND/OR A NUMBER").',
        'A hyphenated word (e.g. "well-known") counts as one word; a number can count as a word.'
      )
    ),
    jsonb_build_object(
      'tag', 'core-full',
      'title', 'A 4-step method',
      'bullets', jsonb_build_array(
        '1. Read the gapped sentence and predict the TYPE of word needed (noun? number? verb?).',
        '2. Underline keywords and scan the passage — answers come in passage order.',
        '3. Find the matching sentence; the answer is usually right beside the keywords.',
        '4. Drop the word in and check it fits the grammar and the word limit.'
      )
    ),
    jsonb_build_object(
      'tag', 'worked-medium',
      'title', 'Worked example',
      'content', 'Passage: "Early lighthouses burned wood, but by the 1800s most had switched to oil lamps." Sentence (ONE WORD): "By the nineteenth century, most lighthouses were lit using ____."',
      'bullets', jsonb_build_array(
        'The gap needs a thing that lit the lighthouse (a noun).',
        'Scan to the 1800s detail: "switched to oil lamps".',
        'The limit is ONE WORD, so "oil lamps" is too many — use the key word.'
      ),
      'answer', 'oil — within the one-word limit and taken straight from the passage.'
    ),
    jsonb_build_object(
      'tag', 'common-mistakes',
      'title', 'The traps',
      'bullets', jsonb_build_array(
        'Going over the word limit — an over-length answer is marked wrong even if it contains the right word.',
        'Changing the word''s form (singular/plural, tense) so it no longer matches the passage.',
        'Paraphrasing in your own words instead of copying the passage''s words.',
        'Spelling the copied word incorrectly — a misspelt answer loses the mark.'
      )
    ),
    jsonb_build_object(
      'tag', 'recap',
      'title', 'Quick checklist',
      'bullets', jsonb_build_array(
        'Predict the word type -> scan in order -> copy exactly.',
        'Within the limit, correctly spelled, grammatically fitting.'
      )
    )
  )),
  '55555555-5555-4555-8555-555555555555',
  3, 'published', now()
);
