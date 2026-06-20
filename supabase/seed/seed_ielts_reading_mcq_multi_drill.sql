-- ============================================================
-- Golden drill: mcq_multi (multiple choice, choose several).
-- First real exercise of the multi_select primitive + gradeMultiSelect.
-- options: { choices:[{value,label}], max:N }; answer_key: { values:[...], required:N }.
-- Idempotent via fixed item UUID + leading DELETE (ON DELETE CASCADE).
-- ============================================================

DELETE FROM practice_items
WHERE id = '88888888-8888-4888-8888-888888888888';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '88888888-8888-4888-8888-888888888888',
  'reading_set',
  'reading',
  'academic',
  6.5,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'Vertical farming',
    'passage',
      'A. Vertical farms grow crops in stacked layers inside controlled buildings, often in the middle of cities. ' ||
      'Because the plants are kept indoors under LED lighting, they can be grown all year round, whatever the weather outside. ' ||
      E'\n\n' ||
      'B. Supporters point to several benefits. The farms use up to 95 per cent less water than ordinary fields, because the water is recycled rather than lost to the soil. ' ||
      'They also need no pesticides, since pests are kept out of the sealed buildings, and crops can be harvested close to where people live, cutting transport costs. ' ||
      E'\n\n' ||
      'C. There are obstacles, however. The LED lights and climate controls consume large amounts of electricity, making running costs high. ' ||
      'The buildings are also expensive to construct, and only a limited range of crops — mainly leafy greens and herbs — currently grow well in these conditions.'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — mcq_multi (choose TWO)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('88888888-8888-4888-8888-888888888888', 1, 'mcq_multi',
 'Which TWO benefits of vertical farming does the writer mention?',
 jsonb_build_object('max', 2, 'choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. reduced water use'),
   jsonb_build_object('value', 'B', 'label', 'B. lower electricity bills'),
   jsonb_build_object('value', 'C', 'label', 'C. a wider variety of crops'),
   jsonb_build_object('value', 'D', 'label', 'D. less need for pesticides'),
   jsonb_build_object('value', 'E', 'label', 'E. faster plant growth')
 )),
 '{"values": ["A", "D"], "required": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph B lists using far less water and needing no pesticides as benefits.',
   'evidence', 'Paragraph B: "use up to 95 per cent less water" and "need no pesticides".',
   'distractors', jsonb_build_object(
     'B', 'Electricity costs are high, not low (paragraph C).',
     'C', 'Only a limited range of crops grows well (paragraph C).',
     'E', 'Faster growth is never mentioned.'
   )
 ));

-- Q2 — mcq_multi (choose TWO)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('88888888-8888-4888-8888-888888888888', 2, 'mcq_multi',
 'Which TWO problems with vertical farming does the writer mention?',
 jsonb_build_object('max', 2, 'choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. high energy consumption'),
   jsonb_build_object('value', 'B', 'label', 'B. poor crop quality'),
   jsonb_build_object('value', 'C', 'label', 'C. expensive buildings'),
   jsonb_build_object('value', 'D', 'label', 'D. frequent pest damage'),
   jsonb_build_object('value', 'E', 'label', 'E. long transport distances')
 )),
 '{"values": ["A", "C"], "required": 2}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph C names high electricity use and expensive construction as obstacles.',
   'evidence', 'Paragraph C: "consume large amounts of electricity" and "expensive to construct".',
   'distractors', jsonb_build_object(
     'B', 'Crop quality is not discussed.',
     'D', 'Pests are kept out of the sealed buildings (paragraph B).',
     'E', 'Crops are harvested close to where people live (paragraph B).'
   )
 ));
