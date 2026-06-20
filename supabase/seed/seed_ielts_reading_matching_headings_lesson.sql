-- ============================================================
-- Seed: the worked Matching headings module — a skill_lessons row (the
-- lesson) plus a single-type matching_headings drill practice_item (the
-- test) whose questions carry explanations. Idempotent via fixed UUIDs.
--
-- Matching headings tests the MAIN IDEA of each paragraph, so the drill
-- passage has clearly-themed paragraphs (A–E) and a shared list of headings
-- (with two extra headings as distractors). Each question reuses the full
-- heading list as its single_select choices.
--
-- Column conventions (migration 007):
--   options    (single_select) : { "choices": [{ value, label }, ... ] }
--   answer_key (single_select) : { "value": "iii" }  (server-only)
-- ============================================================

-- The drill practice_item (fixed id so the lesson can reference it).
DELETE FROM practice_items WHERE id = '77777777-7777-4777-8777-777777777777';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '77777777-7777-4777-8777-777777777777',
  'reading_set', 'reading', 'academic', 7.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'demo_key', 'drill-matching-headings',
    'title', 'Matching headings — practice',
    'passage',
      'A. On a hot afternoon, a street lined with mature trees can be several degrees cooler than a bare one nearby. ' ||
      'The canopy blocks direct sunlight, and as the leaves release water vapour they draw heat from the surrounding air, working much like a natural air conditioner.' ||
      E'\n\n' ||
      'B. Trees also act as living filters. Their leaves trap dust and absorb gases produced by traffic, so the air that residents breathe on tree-lined streets tends to contain fewer harmful particles.' ||
      E'\n\n' ||
      'C. The benefits are not only physical. Studies repeatedly find that people who can see greenery from their homes report lower stress and a brighter mood, and hospital patients with a view of trees often recover more quickly.' ||
      E'\n\n' ||
      'D. Keeping city trees healthy is not cheap, however. Councils must pay to plant them, prune them, clear fallen leaves and occasionally repair pavements lifted by spreading roots, and these bills can strain a tight budget.' ||
      E'\n\n' ||
      'E. For this reason, many cities now invite local people to help. Volunteers water young trees through dry spells and report damage, and neighbourhoods that take part tend to lose far fewer newly planted trees.',
    'minimum_reading_minutes', 12
  ),
  'published', 'seed-v1', now()
);

-- Every question offers the SAME list of headings; the answer is the roman
-- numeral of the heading that captures that paragraph's main idea.
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('77777777-7777-4777-8777-777777777777', 1, 'matching_headings',
 'Choose the correct heading for Paragraph A.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'i',   'label', 'i. Cleaner air for residents'),
   jsonb_build_object('value', 'ii',  'label', 'ii. The cost of looking after them'),
   jsonb_build_object('value', 'iii', 'label', 'iii. A natural cooling system'),
   jsonb_build_object('value', 'iv',  'label', 'iv. Boosting people''s wellbeing'),
   jsonb_build_object('value', 'v',   'label', 'v. A magnet for tourists'),
   jsonb_build_object('value', 'vi',  'label', 'vi. The history of city planning'),
   jsonb_build_object('value', 'vii', 'label', 'vii. Getting residents involved')
 )),
 '{"value": "iii"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The whole paragraph is about trees cooling the street by shading and releasing water vapour — "a natural air conditioner".',
   'evidence', 'Paragraph A: "several degrees cooler ... working much like a natural air conditioner."'
 )),
('77777777-7777-4777-8777-777777777777', 2, 'matching_headings',
 'Choose the correct heading for Paragraph B.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'i',   'label', 'i. Cleaner air for residents'),
   jsonb_build_object('value', 'ii',  'label', 'ii. The cost of looking after them'),
   jsonb_build_object('value', 'iii', 'label', 'iii. A natural cooling system'),
   jsonb_build_object('value', 'iv',  'label', 'iv. Boosting people''s wellbeing'),
   jsonb_build_object('value', 'v',   'label', 'v. A magnet for tourists'),
   jsonb_build_object('value', 'vi',  'label', 'vi. The history of city planning'),
   jsonb_build_object('value', 'vii', 'label', 'vii. Getting residents involved')
 )),
 '{"value": "i"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph B''s main idea is that trees filter dust and traffic gases, so residents breathe cleaner air.',
   'evidence', 'Paragraph B: "living filters ... the air that residents breathe ... fewer harmful particles."'
 )),
('77777777-7777-4777-8777-777777777777', 3, 'matching_headings',
 'Choose the correct heading for Paragraph C.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'i',   'label', 'i. Cleaner air for residents'),
   jsonb_build_object('value', 'ii',  'label', 'ii. The cost of looking after them'),
   jsonb_build_object('value', 'iii', 'label', 'iii. A natural cooling system'),
   jsonb_build_object('value', 'iv',  'label', 'iv. Boosting people''s wellbeing'),
   jsonb_build_object('value', 'v',   'label', 'v. A magnet for tourists'),
   jsonb_build_object('value', 'vi',  'label', 'vi. The history of city planning'),
   jsonb_build_object('value', 'vii', 'label', 'vii. Getting residents involved')
 )),
 '{"value": "iv"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The paragraph is about mental benefits — lower stress, brighter mood, faster recovery — i.e. wellbeing.',
   'evidence', 'Paragraph C: "lower stress and a brighter mood ... recover more quickly."'
 )),
('77777777-7777-4777-8777-777777777777', 4, 'matching_headings',
 'Choose the correct heading for Paragraph D.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'i',   'label', 'i. Cleaner air for residents'),
   jsonb_build_object('value', 'ii',  'label', 'ii. The cost of looking after them'),
   jsonb_build_object('value', 'iii', 'label', 'iii. A natural cooling system'),
   jsonb_build_object('value', 'iv',  'label', 'iv. Boosting people''s wellbeing'),
   jsonb_build_object('value', 'v',   'label', 'v. A magnet for tourists'),
   jsonb_build_object('value', 'vi',  'label', 'vi. The history of city planning'),
   jsonb_build_object('value', 'vii', 'label', 'vii. Getting residents involved')
 )),
 '{"value": "ii"}'::jsonb,
 jsonb_build_object(
   'rationale', 'This paragraph lists the expenses of caring for city trees — planting, pruning, clearing leaves, repairing pavements.',
   'evidence', 'Paragraph D: "not cheap ... pay to plant them, prune them ... strain a tight budget."'
 )),
('77777777-7777-4777-8777-777777777777', 5, 'matching_headings',
 'Choose the correct heading for Paragraph E.',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'i',   'label', 'i. Cleaner air for residents'),
   jsonb_build_object('value', 'ii',  'label', 'ii. The cost of looking after them'),
   jsonb_build_object('value', 'iii', 'label', 'iii. A natural cooling system'),
   jsonb_build_object('value', 'iv',  'label', 'iv. Boosting people''s wellbeing'),
   jsonb_build_object('value', 'v',   'label', 'v. A magnet for tourists'),
   jsonb_build_object('value', 'vi',  'label', 'vi. The history of city planning'),
   jsonb_build_object('value', 'vii', 'label', 'vii. Getting residents involved')
 )),
 '{"value": "vii"}'::jsonb,
 jsonb_build_object(
   'rationale', 'The paragraph is about cities inviting local people to help look after trees, and the benefit of that involvement.',
   'evidence', 'Paragraph E: "invite local people to help. Volunteers water young trees ... lose far fewer newly planted trees."'
 ));

-- The lesson (skill_lessons row), linked to the drill above.
DELETE FROM skill_lessons WHERE slug = 'reading-matching-headings';

INSERT INTO skill_lessons (
  section, question_type, slug, title, summary, slides_data, drill_item_id, position, status, published_at
) VALUES (
  'reading', 'matching_headings', 'reading-matching-headings',
  'Matching headings',
  'Match each paragraph to the heading that captures its MAIN idea — not a heading that just repeats one detail.',
  jsonb_build_object('blocks', jsonb_build_array(
    jsonb_build_object(
      'tag', 'foundational',
      'title', 'What this question asks',
      'content', 'You pick the heading that best summarises each paragraph. There are always more headings than paragraphs, so some headings are never used.',
      'bullets', jsonb_build_array(
        'A heading must fit the WHOLE paragraph, not one sentence.',
        'Some headings are distractors that match only a small detail.',
        'Each heading is used once at most.'
      )
    ),
    jsonb_build_object(
      'tag', 'core-full',
      'title', 'A 4-step method',
      'bullets', jsonb_build_array(
        '1. Read the paragraph and ask: what is this MAINLY about? Sum it up in your own words.',
        '2. The main idea is often in the first or last sentence — but check the whole paragraph.',
        '3. Find the heading closest to your summary.',
        '4. Cross out each heading once used so it cannot be reused, and leave the trickiest paragraphs till last.'
      )
    ),
    jsonb_build_object(
      'tag', 'worked-medium',
      'title', 'Worked example',
      'content', 'Paragraph: "Bamboo grows astonishingly fast, sometimes a metre in a day. Because it regrows so quickly after cutting, builders increasingly use it as a sustainable timber." Headings: i) A dangerous plant  ii) A fast-growing, sustainable material  iii) Bamboo in cooking.',
      'bullets', jsonb_build_array(
        'The paragraph is mainly about fast growth AND sustainable use in building.',
        'i) "dangerous" is never mentioned; iii) "cooking" is not in this paragraph.',
        'ii) covers both the speed and the sustainable-material point — the whole paragraph.'
      ),
      'answer', 'ii — it captures the paragraph''s main idea (fast-growing and sustainable), not just one detail.'
    ),
    jsonb_build_object(
      'tag', 'common-mistakes',
      'title', 'The traps',
      'bullets', jsonb_build_array(
        'Picking a heading because it repeats a word from the paragraph — that word may be a minor detail.',
        'Choosing a heading that fits only the first sentence while the paragraph moves on to something else.',
        'Spending too long on one hard paragraph — do the clear ones first to shrink the list.',
        'Forgetting that extra headings are there on purpose to tempt you.'
      )
    ),
    jsonb_build_object(
      'tag', 'recap',
      'title', 'Quick checklist',
      'bullets', jsonb_build_array(
        'Summarise the paragraph yourself -> match the closest heading.',
        'Whole-paragraph fit beats detail-matching. Do the easy ones first.'
      )
    )
  )),
  '77777777-7777-4777-8777-777777777777',
  5, 'published', now()
);
