-- ============================================================
-- Agri Nova – Community Questions & Answers
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CREATE TABLES
-- ────────────────────────────────────────────────────────────

-- Community Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  user_name TEXT,
  answers_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  user_name TEXT,
  is_accepted BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers   ENABLE ROW LEVEL SECURITY;

-- Questions policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read questions' AND tablename = 'questions') THEN
    CREATE POLICY "Public can read questions" ON questions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth can create questions' AND tablename = 'questions') THEN
    CREATE POLICY "Auth can create questions" ON questions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth can update own questions' AND tablename = 'questions') THEN
    CREATE POLICY "Auth can update own questions" ON questions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Answers policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read answers' AND tablename = 'answers') THEN
    CREATE POLICY "Public can read answers" ON answers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth can create answers' AND tablename = 'answers') THEN
    CREATE POLICY "Auth can create answers" ON answers FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth can update own answers' AND tablename = 'answers') THEN
    CREATE POLICY "Auth can update own answers" ON answers FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow anonymous/public inserts (for guest question posting)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert questions' AND tablename = 'questions') THEN
    CREATE POLICY "Anyone can insert questions" ON questions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert answers' AND tablename = 'answers') THEN
    CREATE POLICY "Anyone can insert answers" ON answers FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. AUTO-INCREMENT answers_count TRIGGER
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE questions SET answers_count = answers_count - 1 WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_answer_change ON answers;
CREATE TRIGGER on_answer_change
  AFTER INSERT OR DELETE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_answers_count();

-- ────────────────────────────────────────────────────────────
-- 4. SEED QUESTIONS (10 questions)
-- ────────────────────────────────────────────────────────────

INSERT INTO questions (title, content, category, user_name, answers_count, views, created_at)
VALUES
  (
    'My tomato plants have yellow leaves with brown spots. What disease is this and how to treat?',
    'The leaves started turning yellow from the bottom. Now there are brown circular spots on the leaves. I''m worried this might spread to all plants.',
    'crop',
    'Ramesh Kumar',
    2, 156,
    '2026-04-11T14:00:00Z'::timestamptz
  ),
  (
    'Which fertilizer is best for wheat in sandy soil?',
    'I have sandy loam soil in my field. What NPK ratio should I use for wheat cultivation this rabi season?',
    'soil',
    'Suresh Patel',
    1, 89,
    '2026-04-08T09:00:00Z'::timestamptz
  ),
  (
    'How often should I irrigate paddy during summer?',
    'It''s summer season and temperatures are rising. What''s the recommended irrigation schedule for paddy?',
    'irrigation',
    'Vijay Reddy',
    3, 234,
    '2026-04-12T16:30:00Z'::timestamptz
  ),
  (
    'Will heavy rainfall affect mango flowering season?',
    'There''s heavy rainfall forecast for next week. I have mango trees that are about to flower. Should I be worried?',
    'weather',
    'Anil Sharma',
    1, 67,
    '2026-04-10T11:20:00Z'::timestamptz
  ),
  (
    'What are the best practices for organic farming?',
    'I want to switch to organic farming. What are the basic practices I should follow for vegetables?',
    'general',
    'Mahesh Singh',
    2, 312,
    '2026-04-06T15:45:00Z'::timestamptz
  ),
  (
    'Best time to plant cotton in North India?',
    'I am planning to grow cotton this year. When is the ideal time to sow seeds in Punjab area?',
    'crop',
    'Gurpreet Singh',
    4, 567,
    '2026-04-05T08:15:00Z'::timestamptz
  ),
  (
    'How to control whitefly in chili plants?',
    'My chili crop is infested with whiteflies. Suggest some effective organic or chemical control methods.',
    'crop',
    'Deepak Verma',
    2, 128,
    '2026-04-09T13:10:00Z'::timestamptz
  ),
  (
    'Soil testing laboratories near Hyderabad?',
    'I want to get my soil tested for nutrients. Does anyone know reliable government or private labs near Hyderabad?',
    'soil',
    'K. Srinivas',
    0, 45,
    '2026-04-12T10:00:00Z'::timestamptz
  ),
  (
    'Subsidy for drip irrigation in Maharashtra?',
    'What is the current subsidy percentage for installing drip irrigation systems for fruit orchards in MH?',
    'irrigation',
    'Amol Patil',
    5, 890,
    '2026-04-01T12:00:00Z'::timestamptz
  ),
  (
    'How to store potatoes for a long time without cold storage?',
    'Prices are low right now. I want to store my harvest for 2-3 months. Any traditional storage tips?',
    'general',
    'Rajesh Yadav',
    3, 423,
    '2026-04-03T17:30:00Z'::timestamptz
  );

-- ────────────────────────────────────────────────────────────
-- 5. SEED ANSWERS (linked to questions above)
--    We use a CTE to look up question IDs by title.
-- ────────────────────────────────────────────────────────────

-- Answers for Q1: Tomato yellow leaves
WITH q AS (
  SELECT id FROM questions WHERE title ILIKE '%tomato plants have yellow leaves%' LIMIT 1
)
INSERT INTO answers (question_id, content, user_name, is_accepted, upvotes, created_at)
SELECT q.id,
  'Based on your description, this sounds like Early Blight (Alternaria solani). The yellow leaves with brown concentric spots are classic symptoms. Here''s what to do:

1. Remove affected leaves immediately
2. Apply copper-based fungicide (e.g., Copper Oxychloride 50% @ 2-3 g per liter)
3. Ensure proper spacing between plants for air circulation
4. Avoid overhead irrigation - water at base
5. Apply neem oil spray weekly as preventive measure',
  'Dr. Prakash Rao', true, 12, '2026-04-12T10:00:00Z'::timestamptz
FROM q
UNION ALL
SELECT q.id,
  'I had the same issue last year. The brown spots with yellow halo are definitely early blight. I used Mancozeb 75% WP @ 2g per liter and it worked well. Also, make sure to remove plant debris after harvest as the fungus can overwinter.',
  'Krishna Murthy', false, 8, '2026-04-12T18:00:00Z'::timestamptz
FROM q;

-- Answers for Q2: Wheat fertilizer
WITH q AS (
  SELECT id FROM questions WHERE title ILIKE '%fertilizer is best for wheat in sandy%' LIMIT 1
)
INSERT INTO answers (question_id, content, user_name, is_accepted, upvotes, created_at)
SELECT q.id,
  'For sandy soil, I recommend using DAP (Di-Ammonium Phosphate) with urea. Apply:
- DAP: 100 kg/acre
- Urea: 50 kg/acre
- Also add zinc sulfate 25 kg/acre

Sandy soil has low nutrient retention, so split the urea application - half at sowing and half at knee height stage.',
  'Agriculture Officer Venkatesh', true, 5, '2026-04-09T14:00:00Z'::timestamptz
FROM q;

-- Answers for Q3: Paddy irrigation
WITH q AS (
  SELECT id FROM questions WHERE title ILIKE '%irrigate paddy during summer%' LIMIT 1
)
INSERT INTO answers (question_id, content, user_name, is_accepted, upvotes, created_at)
SELECT q.id,
  'For paddy in summer, I recommend alternate wetting and drying (AWD) method:
- Irrigate when water level drops 5cm below soil surface
- Maintain 2-5cm water depth during critical stages
- Drain field 15 days before harvest
This saves 30% water and reduces disease incidence.',
  'Balu Naidu', true, 15, '2026-04-13T08:00:00Z'::timestamptz
FROM q
UNION ALL
SELECT q.id,
  'During summer, water evaporates quickly. I irrigate every 2-3 days in the first month, then weekly after that. The key is to keep the field saturated but not flooded. Morning irrigation is best.',
  'Ravi Kumar', false, 7, '2026-04-13T10:00:00Z'::timestamptz
FROM q
UNION ALL
SELECT q.id,
  'Don''t overwater! Excess water leads to root rot and bacterial diseases. Use furrow irrigation instead of flooding. Check soil moisture with your hand - if it forms a ball and doesn''t crumble, there''s enough moisture.',
  'Sunita Devi', false, 9, '2026-04-13T14:00:00Z'::timestamptz
FROM q;

-- Answers for Q4: Mango flowering
WITH q AS (
  SELECT id FROM questions WHERE title ILIKE '%rainfall affect mango flowering%' LIMIT 1
)
INSERT INTO answers (question_id, content, user_name, is_accepted, upvotes, created_at)
SELECT q.id,
  'Moderate rainfall during flowering is actually beneficial for mango trees as it helps with pollination. However, heavy rainfall can:
- Wash away pollen
- Increase fungal diseases like anthracnose
- Cause flower drop

Protect flowering trees with plastic sheet covers during heavy rain.',
  'Horticulture Expert Radha', true, 6, '2026-04-11T09:00:00Z'::timestamptz
FROM q;

-- Answers for Q5: Organic farming
WITH q AS (
  SELECT id FROM questions WHERE title ILIKE '%best practices for organic farming%' LIMIT 1
)
INSERT INTO answers (question_id, content, user_name, is_accepted, upvotes, created_at)
SELECT q.id,
  'Key practices for organic vegetable farming:
1. Use compost and vermicompost - 2-3 tons/acre
2. Practice crop rotation (legume → leafy → fruiting)
3. Use neem-based pest control
4. Mulching to retain moisture and control weeds
5. Green manure crops before planting
6. Biological pest control (trichogramma cards)

Start small and expand gradually!',
  'Organic Farmer Gopal', true, 18, '2026-04-07T11:00:00Z'::timestamptz
FROM q
UNION ALL
SELECT q.id,
  'The most important thing in organic farming is soil health. Focus on:
- Adding organic matter regularly
- Using biofertilizers (Azotobacter, PSB)
- Avoiding chemical pesticides
- Companion planting
- Natural predators for pest management

It takes time but yields better quality produce with premium prices!',
  'Meera Jain', false, 11, '2026-04-08T15:00:00Z'::timestamptz
FROM q;

-- ────────────────────────────────────────────────────────────
-- 6. RESET answers_count to match actual counts
-- ────────────────────────────────────────────────────────────

UPDATE questions q
SET answers_count = (
  SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id
);

-- ============================================================
-- Done! Your community now has 10 questions and 11 answers.
-- ============================================================
