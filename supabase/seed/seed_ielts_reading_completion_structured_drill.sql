-- ============================================================
-- Golden drill: completion (structured) — MVP-flat rendering.
-- table_completion + flowchart_completion + diagram_label, all text_fill.
-- The table/flow-chart/diagram are preformatted text in payload.passage with
-- [ N ] gap markers; each gap is a numbered text_fill question. A faithful
-- visual stimulus renderer is a later phase (see roadmap).
-- ============================================================

DELETE FROM practice_items
WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'reading_set',
  'reading',
  'academic',
  6.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'How chocolate is made',
    'passage',
      'Chocolate begins as the seeds of the cacao tree and passes through several stages before it reaches the shops. ' ||
      'After harvesting, workers remove the beans and let them ferment for several days, which develops the chocolate''s flavour. ' ||
      'The beans are then dried in the sun to reduce their moisture, roasted, and ground into a smooth paste. ' ||
      'Each pod has a tough outer shell that protects the beans inside.' ||
      E'\n\n' ||
      '--- FLOW-CHART (complete the gaps) ---' || E'\n' ||
      'Harvest pods  ->  Remove the [ 1 ]  ->  Ferment for several days  ->  Dry in the sun  ->  Roast  ->  Grind into a [ 2 ]' ||
      E'\n\n' ||
      '--- TABLE (complete the gap) ---' || E'\n' ||
      'Stage         | Purpose' || E'\n' ||
      'Fermentation  | develops the [ 3 ]' || E'\n' ||
      'Drying        | reduces the moisture in the beans' ||
      E'\n\n' ||
      '--- DIAGRAM (label the part) ---' || E'\n' ||
      'A cacao pod cut open: the beans inside are protected by a thick outer [ 4 ].'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — flowchart_completion (gap 1)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1, 'flowchart_completion',
 'Flow-chart gap [ 1 ]: After harvesting, workers remove the ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["beans"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The prose says workers remove the beans after harvesting.',
   'evidence', '"After harvesting, workers remove the beans".'
 ));

-- Q2 — flowchart_completion (gap 2)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2, 'flowchart_completion',
 'Flow-chart gap [ 2 ]: The beans are roasted and ground into a ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["paste", "liquor"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The prose says the beans are ground into a smooth paste.',
   'evidence', '"ground into a smooth paste".'
 ));

-- Q3 — table_completion (gap 3)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 3, 'table_completion',
 'Table gap [ 3 ]: Fermentation develops the ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["flavour", "flavor"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'Fermentation is described as developing the chocolate''s flavour.',
   'evidence', '"let them ferment ... which develops the chocolate''s flavour".'
 ));

-- Q4 — diagram_label (gap 4)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 4, 'diagram_label',
 'Diagram gap [ 4 ]: The beans are protected by a thick outer ____. (ONE WORD)',
 jsonb_build_object('word_limit', 1),
 '{"accepted": ["shell", "husk"], "word_limit": 1}'::jsonb,
 jsonb_build_object(
   'rationale', 'The prose states each pod has a tough outer shell protecting the beans.',
   'evidence', '"Each pod has a tough outer shell that protects the beans inside".'
 ));
