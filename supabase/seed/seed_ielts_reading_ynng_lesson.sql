-- ============================================================
-- Seed: the worked Yes / No / Not Given module — a skill_lessons row
-- (the lesson) plus a single-type ynng drill practice_item (the test) whose
-- questions carry explanations. The lesson links to the drill via
-- drill_item_id. Idempotent via fixed UUIDs.
--
-- YNNG is TFNG's sibling: it tests agreement with the WRITER'S VIEWS /
-- claims (opinion), not with factual information. The drill passage is
-- therefore opinion-rich (first person, hedged claims).
-- ============================================================

-- The drill practice_item (fixed id so the lesson can reference it).
DELETE FROM practice_items WHERE id = '44444444-4444-4444-8444-444444444444';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '44444444-4444-4444-8444-444444444444',
  'reading_set', 'reading', 'academic', 6.5,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'drill-ynng',
    'title', 'Yes / No / Not Given — practice',
    'passage',
      'Advocates of the four-day working week argue that compressing work into fewer days need not reduce output. ' ||
      'In my view, the evidence from recent company trials is genuinely persuasive: firms that shortened the week reported steady or even higher productivity. ' ||
      'Critics who dismiss these results as a short-lived novelty are, I believe, too quick to judge.' ||
      E'\n\n' ||
      'Of course, not every industry can adopt the model easily. Hospitals and shops, which must stay open, face real obstacles. ' ||
      'Yet even there, I would argue that creative scheduling could capture some of the benefits. ' ||
      'The common claim that a shorter week mainly rewards employers strikes me as mistaken; the gains in well-being clearly flow to workers first.',
    'minimum_reading_minutes', 8
  ),
  'published', 'seed-v1', now()
);

INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('44444444-4444-4444-8444-444444444444', 1, 'ynng',
 'The writer finds the evidence from four-day-week trials convincing.',
 NULL, '{"value": "YES"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The writer calls the trial evidence "genuinely persuasive", which agrees with the statement.',
   'evidence', 'Paragraph 1: "the evidence from recent company trials is genuinely persuasive".'
 )),
('44444444-4444-4444-8444-444444444444', 2, 'ynng',
 'The writer agrees with critics that the trial results will not last.',
 NULL, '{"value": "NO"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The writer says critics who dismiss the results are "too quick to judge", so the writer disagrees with them — this contradicts the statement.',
   'evidence', 'Paragraph 1: "Critics who dismiss these results ... are, I believe, too quick to judge."',
   'distractors', jsonb_build_object('NOT GIVEN', 'The writer does state a view here, so it is No, not Not Given.')
 )),
('44444444-4444-4444-8444-444444444444', 3, 'ynng',
 'The writer thinks every industry can switch to a four-day week without difficulty.',
 NULL, '{"value": "NO"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The writer explicitly says not every industry can adopt the model easily and names real obstacles, contradicting the statement.',
   'evidence', 'Paragraph 2: "not every industry can adopt the model easily ... face real obstacles."'
 )),
('44444444-4444-4444-8444-444444444444', 4, 'ynng',
 'The writer has personally taken part in a four-day-week trial.',
 NULL, '{"value": "NOT GIVEN"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The writer gives opinions about the trials but never says whether they took part in one, so we cannot tell.',
   'evidence', 'No sentence mentions the writer''s own participation.'
 )),
('44444444-4444-4444-8444-444444444444', 5, 'ynng',
 'In the writer''s opinion, workers benefit more than employers from a shorter week.',
 NULL, '{"value": "YES"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The writer calls the "mainly rewards employers" claim mistaken and says the well-being gains flow to workers first, agreeing with the statement.',
   'evidence', 'Paragraph 2: "the gains in well-being clearly flow to workers first."',
   'distractors', jsonb_build_object('NOT GIVEN', 'The writer states this view directly, so it is Yes.')
 ));

-- The lesson (skill_lessons row), linked to the drill above.
DELETE FROM skill_lessons WHERE slug = 'reading-ynng';

INSERT INTO skill_lessons (
  section, question_type, slug, title, summary, slides_data, drill_item_id, position, status, published_at
) VALUES (
  'reading', 'ynng', 'reading-ynng',
  'Yes / No / Not Given',
  'Decide whether each statement agrees with the writer''s opinions — and tell a disagreed view (No) from one the writer never gives (Not Given).',
  jsonb_build_object('blocks', jsonb_build_array(
    jsonb_build_object(
      'tag', 'foundational',
      'title', 'What this question asks',
      'content', 'Yes / No / Not Given is about the writer''s OPINIONS and claims, not plain facts. (That is the one difference from True / False / Not Given.)',
      'bullets', jsonb_build_array(
        'YES — the statement agrees with the writer''s view.',
        'NO — the statement contradicts the writer''s view.',
        'NOT GIVEN — the writer never expresses a view on this point.'
      )
    ),
    jsonb_build_object(
      'tag', 'core-full',
      'title', 'A 4-step method',
      'bullets', jsonb_build_array(
        '1. Underline the keywords in the statement.',
        '2. Hunt for opinion language: I believe, in my view, argue, strikes me as, clearly.',
        '3. Find where the writer comments on that idea and read closely.',
        '4. Decide: agrees = Yes, contradicts = No, no view given = Not Given.'
      )
    ),
    jsonb_build_object(
      'tag', 'worked-medium',
      'title', 'Worked example',
      'content', 'Writer: "Some say streaming has killed the album. I find that claim overblown — artists still build records as a single experience." Statement: "The writer believes streaming has destroyed the album."',
      'bullets', jsonb_build_array(
        'The writer reports the "killed the album" claim, then calls it overblown.',
        'So the writer''s own view is the opposite of the statement.',
        'Disagreed view = No (not Not Given — a view IS given).'
      ),
      'answer', 'NO — the writer calls that claim overblown, so the statement contradicts the writer''s view.'
    ),
    jsonb_build_object(
      'tag', 'common-mistakes',
      'title', 'The traps',
      'bullets', jsonb_build_array(
        'Confusing a view the writer REPORTS from others with the writer''s OWN view — answer to the writer''s opinion.',
        'Choosing No when the writer simply never comments — no view means Not Given.',
        'Treating a fact as an opinion: if it is just information, you may be in a True/False set instead.'
      )
    ),
    jsonb_build_object(
      'tag', 'recap',
      'title', 'Quick checklist',
      'bullets', jsonb_build_array(
        'Find the writer''s OWN opinion, in passage order.',
        'Agrees = Yes. Contradicts = No. No opinion given = Not Given.'
      )
    )
  )),
  '44444444-4444-4444-8444-444444444444',
  2, 'published', now()
);
