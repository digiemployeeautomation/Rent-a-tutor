-- ============================================================
-- Golden drill: matching family over one passage —
--   matching_information (which paragraph?), matching_features
--   (match claims to researchers), matching_sentence_endings.
-- All single_select: options { choices:[{value,label}] }, answer_key { value }.
-- The shared option bank is repeated per question (no render-once bank yet).
-- ============================================================

DELETE FROM practice_items
WHERE id = '99999999-9999-4999-8999-999999999999';

INSERT INTO practice_items (
  id, type, sub_skill, variant, difficulty_band, criterion_tags, payload, status,
  generator_version, published_at
) VALUES (
  '99999999-9999-4999-8999-999999999999',
  'reading_set',
  'reading',
  'academic',
  7.0,
  '["reading"]'::jsonb,
  jsonb_build_object(
    'title', 'Tracking animal migration',
    'passage',
      'A. Tracking how animals move across the planet was once almost impossible. Early naturalists relied on chance sightings and the reports of travellers, which gave only a rough picture. ' ||
      E'\n\n' ||
      'B. The first big advance came with metal leg rings. By placing a numbered ring on a bird''s leg and waiting for it to be found elsewhere, scientists could finally prove that individual birds travelled vast distances. ' ||
      E'\n\n' ||
      'C. Satellite tags transformed the field again. Small transmitters now send an animal''s position to orbiting satellites several times a day, revealing entire journeys in detail. ' ||
      E'\n\n' ||
      'D. Different researchers favour different methods. Dr Alvarez argues that lightweight rings remain the cheapest way to study large numbers of birds. Professor Chen insists that only satellite tags can capture the full route of a single animal. Dr Okafor focuses on chemical signatures in feathers, which show where a bird has fed. ' ||
      E'\n\n' ||
      'E. Whatever the method, the goal is the same: to map the hidden highways wildlife follows, so that these routes can be protected.'
  ),
  'published',
  'seed-v1',
  now()
);

-- Q1 — matching_information (choices = paragraphs A–E)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 1, 'matching_information',
 'Which paragraph describes how animals were studied before modern technology?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A'),
   jsonb_build_object('value', 'B', 'label', 'B'),
   jsonb_build_object('value', 'C', 'label', 'C'),
   jsonb_build_object('value', 'D', 'label', 'D'),
   jsonb_build_object('value', 'E', 'label', 'E')
 )),
 '{"value": "A"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph A describes the pre-technology era of chance sightings and travellers'' reports.',
   'evidence', 'Paragraph A: "Early naturalists relied on chance sightings and the reports of travellers".'
 ));

-- Q2 — matching_information
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 2, 'matching_information',
 'Which paragraph describes technology that reports an animal''s location automatically?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A'),
   jsonb_build_object('value', 'B', 'label', 'B'),
   jsonb_build_object('value', 'C', 'label', 'C'),
   jsonb_build_object('value', 'D', 'label', 'D'),
   jsonb_build_object('value', 'E', 'label', 'E')
 )),
 '{"value": "C"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Paragraph C describes satellite tags that send positions to satellites several times a day.',
   'evidence', 'Paragraph C: "transmitters now send an animal''s position to orbiting satellites several times a day".'
 ));

-- Q3 — matching_features (choices = researchers)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 3, 'matching_features',
 'Who argues that rings are the cheapest way to study large numbers of birds?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. Dr Alvarez'),
   jsonb_build_object('value', 'B', 'label', 'B. Professor Chen'),
   jsonb_build_object('value', 'C', 'label', 'C. Dr Okafor')
 )),
 '{"value": "A"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Dr Alvarez is the researcher who champions lightweight rings for studying many birds cheaply.',
   'evidence', 'Paragraph D: "Dr Alvarez argues that lightweight rings remain the cheapest way".'
 ));

-- Q4 — matching_features
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 4, 'matching_features',
 'Who says that only satellite tags can capture an animal''s full route?',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. Dr Alvarez'),
   jsonb_build_object('value', 'B', 'label', 'B. Professor Chen'),
   jsonb_build_object('value', 'C', 'label', 'C. Dr Okafor')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Professor Chen is the one who insists satellite tags are needed for a full route.',
   'evidence', 'Paragraph D: "Professor Chen insists that only satellite tags can capture the full route".'
 ));

-- Q5 — matching_sentence_endings (choices = endings)
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 5, 'matching_sentence_endings',
 'Complete the sentence: Metal leg rings made it possible to …',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. send positions to satellites every day.'),
   jsonb_build_object('value', 'B', 'label', 'B. prove that birds travel long distances.'),
   jsonb_build_object('value', 'C', 'label', 'C. analyse chemical signatures in feathers.'),
   jsonb_build_object('value', 'D', 'label', 'D. watch entire journeys unfold in detail.')
 )),
 '{"value": "B"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Rings let scientists prove individual birds travelled vast distances.',
   'evidence', 'Paragraph B: "could finally prove that individual birds travelled vast distances".'
 ));

-- Q6 — matching_sentence_endings
INSERT INTO practice_questions (practice_item_id, position, question_type, prompt, options, answer_key, explanation) VALUES
('99999999-9999-4999-8999-999999999999', 6, 'matching_sentence_endings',
 'Complete the sentence: Satellite transmitters allow scientists to …',
 jsonb_build_object('choices', jsonb_build_array(
   jsonb_build_object('value', 'A', 'label', 'A. send positions to satellites every day.'),
   jsonb_build_object('value', 'B', 'label', 'B. prove that birds travel long distances.'),
   jsonb_build_object('value', 'C', 'label', 'C. analyse chemical signatures in feathers.'),
   jsonb_build_object('value', 'D', 'label', 'D. watch entire journeys unfold in detail.')
 )),
 '{"value": "D"}'::jsonb,
 jsonb_build_object(
   'rationale', 'Satellite tags reveal entire journeys in detail.',
   'evidence', 'Paragraph C: "revealing entire journeys in detail".'
 ));
