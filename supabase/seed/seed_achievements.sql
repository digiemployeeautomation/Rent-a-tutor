-- supabase/seed/seed_achievements.sql

INSERT INTO achievements (name, description, icon, criteria_type, criteria_value) VALUES
  ('Getting Started', 'Completed your first lesson', '🎯', 'lessons_completed', '{"count": 1}'),
  ('Flawless', 'Scored 100% on any quiz', '💎', 'perfect_quiz', '{"count": 1}'),
  ('Week Warrior', '7-day learning streak', '🔥', 'streak', '{"days": 7}'),
  ('Month Master', '30-day learning streak', '⚡', 'streak', '{"days": 30}'),
  ('Century Streak', '100-day learning streak', '🏆', 'streak', '{"days": 100}'),
  ('Topic Champion', 'Completed all lessons in a topic', '🏅', 'topic_complete', '{"count": 1}'),
  ('Term Finisher', 'Completed all topics in a term', '🎓', 'term_complete', '{"count": 1}'),
  ('Quick Learner', 'Passed a quiz on the first attempt', '⭐', 'first_attempt_pass', '{"count": 1}'),
  ('Knowledge Seeker', 'Completed 10 lessons', '📚', 'lessons_completed', '{"count": 10}'),
  ('Scholar', 'Completed 50 lessons', '🎓', 'lessons_completed', '{"count": 50}')
ON CONFLICT (name) DO NOTHING;
