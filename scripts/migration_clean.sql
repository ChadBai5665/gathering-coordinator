CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION increment_gathering_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT NOT NULL CONSTRAINT nickname_length CHECK (char_length(nickname) BETWEEN 1 AND 20),
  avatar_url  TEXT,
  wx_openid   TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gatherings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        CHAR(6) UNIQUE NOT NULL,
  name        TEXT NOT NULL CONSTRAINT gathering_name_length CHECK (char_length(name) BETWEEN 1 AND 50),
  target_time TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting'
              CHECK (status IN ('waiting','recommending','voting','confirmed','active','completed','cancelled')),
  creator_id  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  version     INT DEFAULT 1
);

CREATE TABLE participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id    UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),  
  nickname        TEXT NOT NULL,
  location        JSONB,                            
  location_name   TEXT,
  tastes          TEXT[] DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'joined'
                  CHECK (status IN ('joined','departed','arrived')),
  departure_time  TIMESTAMPTZ,
  travel_duration INT,                              
  departed_at     TIMESTAMPTZ,
  arrived_at      TIMESTAMPTZ,
  reminders_sent  JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE restaurants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id  UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  amap_id       TEXT,                               
  name          TEXT NOT NULL,
  type          TEXT,                                
  address       TEXT,
  location      JSONB NOT NULL,                     
  rating        NUMERIC(2,1),
  cost          NUMERIC(8,2),
  score         INT DEFAULT 0,                      
  travel_infos  JSONB DEFAULT '[]',                 
  is_confirmed  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE votes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id     UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  restaurant_index INT NOT NULL,                    
  proposer_id      UUID NOT NULL REFERENCES auth.users(id),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','passed','rejected')),
  timeout_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vote_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id     UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  agree       BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE(vote_id, user_id)                          
);

CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id  UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                CHECK (type IN (
                  'system','join','depart','arrive',
                  'vote','vote_result','restaurant_confirmed',
                  'reminder','urgent','milestone'
                )),
  text          TEXT NOT NULL,
  target_id     UUID,                               
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gatherings_creator_id ON gatherings(creator_id);
CREATE INDEX idx_gatherings_status     ON gatherings(status);
CREATE INDEX idx_participants_gathering_id ON participants(gathering_id);
CREATE INDEX idx_participants_user_id      ON participants(user_id);
CREATE UNIQUE INDEX idx_participants_gathering_user
  ON participants(gathering_id, user_id)
  WHERE user_id IS NOT NULL;                        
CREATE INDEX idx_restaurants_gathering_id ON restaurants(gathering_id);
CREATE INDEX idx_votes_gathering_id ON votes(gathering_id);
CREATE INDEX idx_votes_status       ON votes(status);
CREATE INDEX idx_vote_records_vote_id ON vote_records(vote_id);
CREATE INDEX idx_messages_gathering_id  ON messages(gathering_id);
CREATE INDEX idx_messages_created_at    ON messages(created_at DESC);
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_gatherings_updated_at
  BEFORE UPDATE ON gatherings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_gatherings_version
  BEFORE UPDATE ON gatherings
  FOR EACH ROW
  EXECUTE FUNCTION increment_gathering_version();
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatherings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "gatherings_select"
  ON gatherings FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "gatherings_insert"
  ON gatherings FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY "gatherings_update_creator"
  ON gatherings FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY "gatherings_update_participant"
  ON gatherings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.gathering_id = gatherings.id
        AND p.user_id = auth.uid()
    )
  );
CREATE OR REPLACE FUNCTION is_gathering_participant(p_gathering_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE gathering_id = p_gathering_id
      AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
CREATE POLICY "participants_select"
  ON participants FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));
CREATE POLICY "participants_insert"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "participants_update"
  ON participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "restaurants_select"
  ON restaurants FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));
CREATE POLICY "restaurants_insert_service"
  ON restaurants FOR INSERT
  TO service_role
  WITH CHECK (true);
CREATE POLICY "restaurants_update_service"
  ON restaurants FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY "votes_select"
  ON votes FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));
CREATE POLICY "votes_insert"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_gathering_participant(gathering_id, auth.uid())
    AND proposer_id = auth.uid()
  );
CREATE POLICY "votes_update_service"
  ON votes FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY "vote_records_select"
  ON vote_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM votes v
      WHERE v.id = vote_records.vote_id
        AND is_gathering_participant(v.gathering_id, auth.uid())
    )
  );
CREATE POLICY "vote_records_insert"
  ON vote_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages_select"
  ON messages FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));
CREATE POLICY "messages_insert_service"
  ON messages FOR INSERT
  TO service_role
  WITH CHECK (true);

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
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE participants;
  END IF;

  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'gatherings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE gatherings;
  END IF;
END $$;
DO $$
BEGIN
END $$;
