ALTER TABLE user_tasks
  ADD COLUMN IF NOT EXISTS scholarship_id UUID REFERENCES scholarships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS user_tasks_scholarship_id_idx ON user_tasks(scholarship_id);
