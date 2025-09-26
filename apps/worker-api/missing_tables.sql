-- Factions table
CREATE TABLE IF NOT EXISTS factions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  description TEXT NOT NULL,
  bonus_multiplier REAL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User factions table
CREATE TABLE IF NOT EXISTS user_factions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  faction_id TEXT NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (faction_id) REFERENCES factions(id),
  UNIQUE(user_id) -- Each user can only be in one faction
);

-- Faction loyalty tracking table
CREATE TABLE IF NOT EXISTS faction_loyalty_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  faction_id TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES quests(id),
  FOREIGN KEY (faction_id) REFERENCES factions(id)
);

CREATE INDEX IF NOT EXISTS idx_faction_loyalty_user_quest ON faction_loyalty_tracking(user_id, quest_id);
CREATE INDEX IF NOT EXISTS idx_user_factions_user_id ON user_factions(user_id);