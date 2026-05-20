-- ============================================================
-- Seed: Form 1 Mathematics — Fractions (one fully-blocked lesson)
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Resolve the Form 1 → Term 1 → Mathematics → Fractions hierarchy.
-- Forms, terms, and subjects are seeded by seed_curriculum.sql; ensure
-- it ran first.

DO $$
DECLARE
  v_form_id    UUID;
  v_term_id    UUID;
  v_subject_id UUID;
  v_unit_id    UUID;
  v_topic_id   UUID;
  v_lesson_id  UUID;
BEGIN
  SELECT id INTO v_form_id    FROM forms        WHERE level = 1;
  SELECT id INTO v_term_id    FROM terms        WHERE form_id = v_form_id AND number = 1;
  SELECT id INTO v_subject_id FROM subjects_new WHERE slug = 'mathematics';

  IF v_form_id IS NULL OR v_term_id IS NULL OR v_subject_id IS NULL THEN
    RAISE EXCEPTION 'seed_curriculum.sql must run first (form/term/subject not found)';
  END IF;

  -- Unit: "Numbers" (number 1 in Term 1 Math)
  INSERT INTO units (term_id, subject_id, number, title, description)
  VALUES (v_term_id, v_subject_id, 1, 'Numbers',
          'Whole numbers, fractions, decimals, and basic operations.')
  ON CONFLICT (term_id, subject_id, number) DO NOTHING;
  SELECT id INTO v_unit_id FROM units
    WHERE term_id = v_term_id AND subject_id = v_subject_id AND number = 1;

  -- Topic: "Fractions"
  SELECT id INTO v_topic_id FROM topics
    WHERE unit_id = v_unit_id AND title = 'Fractions';
  IF v_topic_id IS NULL THEN
    INSERT INTO topics (unit_id, title, description, "order")
    VALUES (v_unit_id, 'Fractions',
            'What fractions mean, equivalent fractions, and basic operations.', 1)
    RETURNING id INTO v_topic_id;
  END IF;

  -- Lesson: "Introduction to Fractions"
  SELECT id INTO v_lesson_id FROM lessons_new
    WHERE topic_id = v_topic_id AND title = 'Introduction to Fractions';
  IF v_lesson_id IS NULL THEN
    INSERT INTO lessons_new (topic_id, title, description, "order", status)
    VALUES (v_topic_id, 'Introduction to Fractions',
            'What a fraction is, the parts of a fraction, and reading fractions.',
            1, 'published')
    RETURNING id INTO v_lesson_id;
  END IF;

  -- Wipe and reseed blocks for this lesson (idempotent rebuild)
  DELETE FROM lesson_blocks WHERE lesson_id = v_lesson_id;

  -- slides_data is a JSONB array; each element is a slide object with
  -- { title, content, bullets?, image? } as expected by components/lesson/SlideViewer.js.
  -- All 9 tag types, with one block each (worked-medium gets two to test ordering).
  INSERT INTO lesson_blocks (lesson_id, tag, order_within_tag, slides_data) VALUES
    (v_lesson_id, 'foundational', 0,
      '[{"title":"Why fractions matter","content":"You meet fractions every day — sharing food, splitting time, measuring ingredients. This lesson teaches what they mean."}]'::jsonb),

    (v_lesson_id, 'core-full', 0,
      '[
        {"title":"What is a fraction?","content":"A fraction shows a part of a whole. It is written as a number on top of a number, with a line between."},
        {"title":"Numerator and denominator","content":"The top number (numerator) shows how many parts you have. The bottom number (denominator) shows how many equal parts the whole is divided into.","bullets":["Numerator = parts you have","Denominator = total equal parts"]},
        {"title":"Reading fractions","content":"Practice reading these:","bullets":["1/2 is read \"one half\"","1/4 is \"one quarter\"","3/4 is \"three quarters\""]}
      ]'::jsonb),

    (v_lesson_id, 'core-summary', 0,
      '[{"title":"Fractions — at a glance","content":"A fraction is part of a whole, written as numerator/denominator. Top = parts you have. Bottom = total equal parts."}]'::jsonb),

    (v_lesson_id, 'worked-easy', 0,
      '[{"title":"Worked example (easy)","content":"A pizza is cut into 4 equal slices. You eat 1 slice. What fraction did you eat? Answer: 1/4. The whole is split into 4 equal parts. You took 1."}]'::jsonb),

    (v_lesson_id, 'worked-medium', 0,
      '[{"title":"Worked example (medium, part 1)","content":"A class of 30 has 12 girls. What fraction of the class are girls? Answer: 12/30, which simplifies to 2/5."}]'::jsonb),

    (v_lesson_id, 'worked-medium', 1,
      '[{"title":"Worked example (medium, part 2)","content":"You read 3/8 of a 64-page book. How many pages have you read? Compute: 3/8 of 64 = (3 × 64) / 8 = 24 pages."}]'::jsonb),

    (v_lesson_id, 'worked-hard', 0,
      '[{"title":"Worked example (hard)","content":"A farmer harvests maize from 5/12 of a 36-hectare field on Monday and 1/4 of the field on Tuesday. How many hectares are harvested in total?","bullets":["Monday: (5/12) × 36 = 15 ha","Tuesday: (1/4) × 36 = 9 ha","Total: 24 ha"]}]'::jsonb),

    (v_lesson_id, 'practice', 0,
      '[{"title":"Try these","content":"Work through these on your own:","bullets":["A chocolate bar has 10 squares. You eat 3. What fraction did you eat?","Read 5/8 aloud.","Write \"three fifths\" as a fraction."]}]'::jsonb),

    (v_lesson_id, 'common-mistakes', 0,
      '[{"title":"Common mistakes","content":"Don''t flip the numerator and denominator. 3/4 (three-quarters) is NOT the same as 4/3. Always check which number is the total (denominator) and which is the part (numerator)."}]'::jsonb),

    (v_lesson_id, 'recap', 0,
      '[{"title":"Recap","content":"A fraction is a part of a whole. Numerator on top, denominator on bottom. The denominator tells you how many equal parts the whole is split into."}]'::jsonb);
END $$;
