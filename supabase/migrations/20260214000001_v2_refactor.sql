-- OnTheWay v2 refactor migration
-- Target: v2 status machine + nominations + choice-voting + new messages schema
-- Note: intended to be applied on a fresh v1 schema (new Supabase project) per v2 plan.

-- ===========================================
-- 1. gatherings: status enum (CHECK)
-- ===========================================

ALTER TABLE gatherings
  DROP CONSTRAINT IF EXISTS gatherings_status_check;

ALTER TABLE gatherings
  ADD CONSTRAINT gatherings_status_check
  CHECK (status IN ('waiting','nominating','voting','confirmed','departing','completed'));

COMMENT ON COLUMN gatherings.status IS '聚会状态机：waiting→nominating→voting→confirmed→departing→completed';

-- ===========================================
-- 2. participants: v2 fields
-- ===========================================

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS is_creator BOOLEAN NOT NULL DEFAULT false;

-- v1: departure_time/travel_duration -> v2: suggested_depart_at/estimated_duration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'participants' AND column_name = 'departure_time'
  ) THEN
    ALTER TABLE participants RENAME COLUMN departure_time TO suggested_depart_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'participants' AND column_name = 'travel_duration'
  ) THEN
    ALTER TABLE participants RENAME COLUMN travel_duration TO estimated_duration;
  END IF;
END $$;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS estimated_distance INTEGER;

-- ===========================================
-- 3. restaurants -> nominations
-- ===========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'restaurants'
  ) THEN
    ALTER TABLE restaurants RENAME TO nominations;
  END IF;
END $$;

-- Rename index if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'idx_restaurants_gathering_id'
  ) THEN
    ALTER INDEX idx_restaurants_gathering_id RENAME TO idx_nominations_gathering_id;
  END IF;
END $$;

ALTER TABLE nominations
  ADD COLUMN IF NOT EXISTS nominated_by UUID,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT;

-- Default existing rows to manual
UPDATE nominations SET source = 'manual' WHERE source IS NULL;

ALTER TABLE nominations
  ALTER COLUMN source SET NOT NULL;

ALTER TABLE nominations
  DROP CONSTRAINT IF EXISTS nominations_source_check;

ALTER TABLE nominations
  ADD CONSTRAINT nominations_source_check
  CHECK (source IN ('manual','ai'));

-- cost: numeric -> integer (v2)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nominations' AND column_name = 'cost'
  ) THEN
    ALTER TABLE nominations
      ALTER COLUMN cost TYPE INTEGER
      USING CASE WHEN cost IS NULL THEN NULL ELSE ROUND(cost)::INTEGER END;
  END IF;
END $$;

-- FK + UNIQUE
ALTER TABLE nominations
  DROP CONSTRAINT IF EXISTS nominations_nominated_by_fkey;

ALTER TABLE nominations
  ADD CONSTRAINT nominations_nominated_by_fkey
  FOREIGN KEY (nominated_by) REFERENCES participants(id) ON DELETE CASCADE;

ALTER TABLE nominations
  DROP CONSTRAINT IF EXISTS nominations_gathering_nominator_key;

ALTER TABLE nominations
  ADD CONSTRAINT nominations_gathering_nominator_key
  UNIQUE (gathering_id, nominated_by, amap_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS nominations_gathering_id_idx ON nominations(gathering_id);
CREATE INDEX IF NOT EXISTS nominations_nominated_by_idx ON nominations(nominated_by);

-- ===========================================
-- 4. votes: choice-voting
-- ===========================================

-- Drop policies that depend on legacy votes columns before dropping columns.
DROP POLICY IF EXISTS "votes_insert" ON votes;
DROP POLICY IF EXISTS "votes_insert_service" ON votes;

ALTER TABLE votes
  DROP CONSTRAINT IF EXISTS votes_status_check;

ALTER TABLE votes
  ADD CONSTRAINT votes_status_check
  CHECK (status IN ('active','resolved'));

ALTER TABLE votes
  DROP COLUMN IF EXISTS restaurant_index,
  DROP COLUMN IF EXISTS proposer_id;

ALTER TABLE votes
  ADD COLUMN IF NOT EXISTS total_participants INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE votes
  DROP CONSTRAINT IF EXISTS votes_result_check;

ALTER TABLE votes
  ADD CONSTRAINT votes_result_check
  CHECK (result IN ('approved','rejected') OR result IS NULL);

-- ===========================================
-- 5. vote_records: agree -> nomination_id
-- ===========================================

ALTER TABLE vote_records
  DROP COLUMN IF EXISTS agree;

ALTER TABLE vote_records
  ADD COLUMN IF NOT EXISTS nomination_id UUID;

ALTER TABLE vote_records
  DROP CONSTRAINT IF EXISTS vote_records_nomination_id_fkey;

ALTER TABLE vote_records
  ADD CONSTRAINT vote_records_nomination_id_fkey
  FOREIGN KEY (nomination_id) REFERENCES nominations(id) ON DELETE CASCADE;

ALTER TABLE vote_records
  ALTER COLUMN nomination_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vote_records_vote_user_key ON vote_records(vote_id, user_id);

-- ===========================================
-- 6. messages: v2 schema
-- ===========================================

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_type_check;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'text'
  ) THEN
    ALTER TABLE messages RENAME COLUMN text TO content;
  END IF;
END $$;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE messages
  ADD CONSTRAINT messages_type_check
  CHECK (type IN (
    'participant_joined',
    'nominating_started',
    'restaurant_nominated',
    'nomination_withdrawn',
    'vote_started',
    'vote_passed',
    'vote_rejected',
    'departed',
    'arrived',
    'nudge',
    'all_arrived'
  ));

-- ===========================================
-- 7. RLS: nominations / votes / vote_records
-- ===========================================

-- nominations table: replace restaurants policies
DROP POLICY IF EXISTS "restaurants_select" ON nominations;
DROP POLICY IF EXISTS "restaurants_insert_service" ON nominations;
DROP POLICY IF EXISTS "restaurants_update_service" ON nominations;

DROP POLICY IF EXISTS "nominations_select" ON nominations;
DROP POLICY IF EXISTS "nominations_insert_service" ON nominations;
DROP POLICY IF EXISTS "nominations_update_service" ON nominations;
DROP POLICY IF EXISTS "nominations_delete_service" ON nominations;

CREATE POLICY "nominations_select" ON nominations
  FOR SELECT TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));

CREATE POLICY "nominations_insert_service" ON nominations
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "nominations_update_service" ON nominations
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "nominations_delete_service" ON nominations
  FOR DELETE TO service_role
  USING (true);

-- votes: API 写入（service_role）
DROP POLICY IF EXISTS "votes_insert" ON votes;
DROP POLICY IF EXISTS "votes_insert_service" ON votes;

CREATE POLICY "votes_insert_service" ON votes
  FOR INSERT TO service_role
  WITH CHECK (true);

-- vote_records: API 写入（service_role）
DROP POLICY IF EXISTS "vote_records_insert" ON vote_records;
DROP POLICY IF EXISTS "vote_records_insert_service" ON vote_records;

CREATE POLICY "vote_records_insert_service" ON vote_records
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ===========================================
-- 8. Realtime publication: add nominations
-- ===========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'nominations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE nominations;
  END IF;
END $$;
