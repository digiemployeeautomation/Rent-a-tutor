-- ============================================================
-- Seed: the worked Multiple choice (single answer) module — a skill_lessons
-- row (the lesson) plus a single-type mcq_single drill practice_item (the
-- test) whose questions carry explanations. Idempotent via fixed UUIDs.
--
-- Column conventions (migration 007):
--   options    (single_select) : { "choices": [{ value, label }, ... ] }
--   answer_key (single_select) : { "value": "B" }  (server-only)
-- ============================================================

-- The drill practice_item (fixed id so the lesson can reference it).
DELETE FROM practice_items WHERE id = '66666666-6666-4666-8666-666666666666';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '66666666-6666-4666-8666-666666666666',
  'reading_set', 'reading', 'academic', 6.5,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'drill-mcq-single',
    'title', 'Multiple choice — practice',
    'passage',
      'When a honeybee discovers a rich source of nectar, it flies back to the hive and performs a "waggle dance" on the vertical face of the comb. ' ||
      'The angle of the dance, measured against vertical, tells the other bees the direction of the food relative to the sun, ' ||
      'while the length of the waggling run indicates how far away it lies. ' ||
      'Remarkably, a dancing bee adjusts the angle as the sun moves across the sky, so that the directions it gives stay accurate throughout the day.' ||
      E'\n\n' ||
      'The dance becomes more energetic when the food source is especially rich, which encourages more of the bees watching to set out and investigate. ' ||
      'When the code was first decoded in the mid-twentieth century, some researchers doubted that so small an insect could pass on such precise information. ' ||
      'Later experiments, in which feeders were placed at known locations, confirmed that the recruited bees flew straight to the correct spot.',
    'minimum_reading_minutes', 10
  ),
  'published', 'seed-v1', now()
);

INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('66666666-6666-4666-8666-666666666666', 1, 'mcq_single',
 'According to the passage, the angle of the waggle dance shows the food''s',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. direction relative to the sun.'),
   jsonb_build_object('value', 'B', 'label', 'B. distance from the hive.'),
   jsonb_build_object('value', 'C', 'label', 'C. richness.'),
   jsonb_build_object('value', 'D', 'label', 'D. height above the ground.')
 )),
 '{"value": "A"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage links the angle of the dance to direction relative to the sun; distance is shown by the length of the run, not the angle.',
   'evidence', 'Paragraph 1: "The angle of the dance ... tells the other bees the direction of the food relative to the sun."',
   'distractors', jsonb_build_object('B', 'Distance is signalled by the length of the waggling run, not the angle.')
 )),
('66666666-6666-4666-8666-666666666666', 2, 'mcq_single',
 'How does a bee indicate how far away the food is?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. By the angle of the dance.'),
   jsonb_build_object('value', 'B', 'label', 'B. By the length of the waggling run.'),
   jsonb_build_object('value', 'C', 'label', 'C. By the height of the dance on the comb.'),
   jsonb_build_object('value', 'D', 'label', 'D. By the number of times it repeats the dance.')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The passage states the length of the waggling run indicates how far the food lies.',
   'evidence', 'Paragraph 1: "the length of the waggling run indicates how far away it lies."'
 )),
('66666666-6666-4666-8666-666666666666', 3, 'mcq_single',
 'Why does the bee change the angle of its dance during the day?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. To rest its wings between dances.'),
   jsonb_build_object('value', 'B', 'label', 'B. To show that the food is running out.'),
   jsonb_build_object('value', 'C', 'label', 'C. To keep the directions accurate as the sun moves.'),
   jsonb_build_object('value', 'D', 'label', 'D. To attract bees from neighbouring hives.')
 )),
 '{"value": "C"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The bee adjusts the angle as the sun moves so the directions stay accurate all day.',
   'evidence', 'Paragraph 1: "adjusts the angle as the sun moves across the sky, so that the directions it gives stay accurate."'
 )),
('66666666-6666-4666-8666-666666666666', 4, 'mcq_single',
 'A more energetic dance tells the watching bees that the food source is',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. very far away.'),
   jsonb_build_object('value', 'B', 'label', 'B. especially rich.'),
   jsonb_build_object('value', 'C', 'label', 'C. close to a predator.'),
   jsonb_build_object('value', 'D', 'label', 'D. about to disappear.')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The dance becomes more energetic when the source is especially rich, prompting more bees to investigate.',
   'evidence', 'Paragraph 2: "The dance becomes more energetic when the food source is especially rich."'
 )),
('66666666-6666-4666-8666-666666666666', 5, 'mcq_single',
 'What did some researchers doubt when the dance was first decoded?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. That bees could see the sun at all.'),
   jsonb_build_object('value', 'B', 'label', 'B. That such a small insect could pass on precise information.'),
   jsonb_build_object('value', 'C', 'label', 'C. That the dance happened on the comb.'),
   jsonb_build_object('value', 'D', 'label', 'D. That feeders could be placed at known locations.')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Some researchers doubted that so small an insect could convey such precise information; later experiments proved it could.',
   'evidence', 'Paragraph 2: "some researchers doubted that so small an insect could pass on such precise information."',
   'distractors', jsonb_build_object('D', 'The feeders were part of the later experiment that CONFIRMED the dance, not what was doubted.')
 ));

-- The lesson (skill_lessons row), linked to the drill above.
DELETE FROM skill_lessons WHERE slug = 'reading-mcq-single';

INSERT INTO skill_lessons (
  section, question_type, slug, title, summary, slides_data, drill_item_id, position, status, published_at
) VALUES (
  'reading', 'mcq_single', 'reading-mcq-single',
  'Multiple choice',
  'Pick the one option the passage fully supports — and learn to spot the half-true and too-extreme distractors.',
  jsonb_build_object('blocks', jsonb_build_array(
    jsonb_build_object(
      'tag', 'foundational',
      'title', 'What this question asks',
      'content', 'You choose ONE option (usually A–D) that best answers the question according to the passage.',
      'bullets', jsonb_build_array(
        'The correct option is fully supported by the text — not just partly true.',
        'Wrong options ("distractors") are designed to look right at a glance.',
        'Answer from the passage only, never from your own knowledge.'
      )
    ),
    jsonb_build_object(
      'tag', 'core-full',
      'title', 'A 4-step method',
      'bullets', jsonb_build_array(
        '1. Read the question stem first and find the part of the passage it refers to (questions follow passage order).',
        '2. Read that section closely BEFORE looking at the options.',
        '3. Try to answer in your own head, then match it to an option.',
        '4. Eliminate: cross off options the passage contradicts or never mentions.'
      )
    ),
    jsonb_build_object(
      'tag', 'worked-medium',
      'title', 'Worked example',
      'content', 'Passage: "Solar panels work even on cloudy days, though they produce less power than in direct sun." Question: "On a cloudy day, solar panels..." A) stop working  B) work, but generate less power  C) work better than in sunshine.',
      'bullets', jsonb_build_array(
        'A is contradicted — they still work on cloudy days.',
        'C is the opposite of what the text says.',
        'B matches exactly: they work but produce less power.'
      ),
      'answer', 'B — the passage says panels still work on cloudy days but produce less power.'
    ),
    jsonb_build_object(
      'tag', 'common-mistakes',
      'title', 'The traps',
      'bullets', jsonb_build_array(
        'Half-right options: one part matches the passage but another part does not — the WHOLE option must be true.',
        'Word-match traps: an option repeats a word from the passage but distorts the meaning.',
        'Extreme wording: always / never / only / the most — usually too strong unless the passage says so.',
        'Choosing a true statement that does not actually answer the question asked.'
      )
    ),
    jsonb_build_object(
      'tag', 'recap',
      'title', 'Quick checklist',
      'bullets', jsonb_build_array(
        'Locate the section -> answer it yourself -> match an option.',
        'The right option is fully supported; eliminate half-true and too-extreme ones.'
      )
    )
  )),
  '66666666-6666-4666-8666-666666666666',
  4, 'published', now()
);
