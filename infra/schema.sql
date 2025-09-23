-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  solana_address TEXT NOT NULL,
  tickets INTEGER DEFAULT 100,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recovery_code TEXT NOT NULL,
  streak_days INTEGER DEFAULT 0,
  last_daily_claim_at DATETIME
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_solana_address ON users(solana_address);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('up_down_call', 'tap_challenge', 'trivia')),
  cooldown_minutes INTEGER DEFAULT 5,
  min_reward INTEGER DEFAULT 10,
  max_reward INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  metadata TEXT
);

-- Quest completions table
CREATE TABLE IF NOT EXISTS quest_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tickets_earned INTEGER NOT NULL,
  result TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES quests(id)
);

CREATE INDEX idx_quest_completions_user ON quest_completions(user_id, completed_at);

-- Raffles table
CREATE TABLE IF NOT EXISTS raffles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prize_pool INTEGER NOT NULL,
  max_entries_per_user INTEGER DEFAULT 10,
  ticket_cost INTEGER DEFAULT 10,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  draw_time DATETIME NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'drawing', 'completed')),
  winner_count INTEGER DEFAULT 1,
  server_seed TEXT,
  client_seed TEXT,
  winners TEXT
);

CREATE INDEX idx_raffles_status ON raffles(status, start_time);

-- Raffle entries table
CREATE TABLE IF NOT EXISTS raffle_entries (
  id TEXT PRIMARY KEY,
  raffle_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  ticket_count INTEGER NOT NULL,
  entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raffle_id) REFERENCES raffles(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(raffle_id, user_id)
);

CREATE INDEX idx_raffle_entries_raffle ON raffle_entries(raffle_id);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tier TEXT CHECK (tier IN ('common', 'rare', 'epic', 'legendary')),
  requirements TEXT
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- Earn log table
CREATE TABLE IF NOT EXISTS earn_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_earn_log_user ON earn_log(user_id, created_at);

-- Boosts table
CREATE TABLE IF NOT EXISTS boosts (
  id TEXT PRIMARY KEY,
  type TEXT CHECK (type IN ('global', 'personal')),
  multiplier REAL NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  source TEXT,
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_boosts_active ON boosts(active, end_time);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  prize_pool INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT false
);

-- Store items table
CREATE TABLE IF NOT EXISTS store_items (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  type TEXT CHECK (type IN ('badge', 'boost', 'cosmetic')),
  image_url TEXT,
  metadata TEXT,
  available BOOLEAN DEFAULT true
);

-- User purchases table
CREATE TABLE IF NOT EXISTS user_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cost INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES store_items(id)
);

CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);

-- Admin claims table
CREATE TABLE IF NOT EXISTS admin_claims (
  id TEXT PRIMARY KEY,
  tx TEXT NOT NULL,
  amount INTEGER NOT NULL,
  token TEXT NOT NULL,
  season_pool INTEGER,
  raffle_pool INTEGER,
  boost_amount INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);