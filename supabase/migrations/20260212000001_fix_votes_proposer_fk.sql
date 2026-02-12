-- Align votes.proposer_id to auth.users(id)

UPDATE votes v
SET proposer_id = p.user_id
FROM participants p
WHERE v.proposer_id = p.id
  AND p.user_id IS NOT NULL;

ALTER TABLE votes
DROP CONSTRAINT IF EXISTS votes_proposer_id_fkey;

ALTER TABLE votes
ADD CONSTRAINT votes_proposer_id_fkey
FOREIGN KEY (proposer_id) REFERENCES auth.users(id);
