-- Seed quests
INSERT INTO quests (id, slug, name, description, type, cooldown_minutes, min_reward, max_reward) VALUES
  ('quest_1', 'up_down_call', 'Market Prediction', 'Predict if $BONK will go up or down in the next 60 seconds', 'up_down_call', 5, 10, 50),
  ('quest_2', 'tap_challenge', 'Tap Frenzy', 'Tap as fast as you can for 10 seconds!', 'tap_challenge', 15, 5, 25),
  ('quest_3', 'trivia_crypto', 'Crypto Trivia', 'Test your crypto knowledge', 'trivia', 10, 15, 40);

-- Seed badges
INSERT INTO badges (id, slug, name, description, tier) VALUES
  ('badge_1', 'welcome', 'Welcome Degen', 'Join the RAFFLE Arcade', 'common'),
  ('badge_2', 'streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'rare'),
  ('badge_3', 'first_raffle', 'Lucky Starter', 'Enter your first raffle', 'common'),
  ('badge_4', 'raffle_winner', 'Winner Winner', 'Win a raffle', 'epic'),
  ('badge_5', 'tap_master', 'Tap Master', 'Score 100+ in Tap Challenge', 'rare'),
  ('badge_6', 'prediction_pro', 'Oracle', 'Get 10 predictions correct', 'epic');

-- Seed store items
INSERT INTO store_items (id, slug, name, description, cost, type) VALUES
  ('item_1', 'double_tickets', 'Double Tickets Boost', '2x tickets for 1 hour', 500, 'boost'),
  ('item_2', 'rainbow_badge', 'Rainbow Badge', 'Exclusive rainbow badge', 1000, 'badge'),
  ('item_3', 'skip_cooldown', 'Skip Cooldown', 'Skip quest cooldown once', 200, 'boost'),
  ('item_4', 'extra_raffle', 'Extra Raffle Entry', 'Get +5 max entries for next raffle', 750, 'boost');

-- Seed current season
INSERT INTO seasons (id, name, start_date, end_date, prize_pool, active) VALUES
  ('season_1', 'Genesis Season', datetime('now'), datetime('now', '+30 days'), 100000, true);

-- Seed upcoming raffles
INSERT INTO raffles (id, name, description, prize_pool, max_entries_per_user, ticket_cost, start_time, end_time, draw_time, status, winner_count) VALUES
  ('raffle_1', 'Hourly Jackpot #1', 'Win big every hour!', 1000, 10, 10, datetime('now'), datetime('now', '+1 hour'), datetime('now', '+1 hour'), 'active', 3),
  ('raffle_2', 'Daily Mega Draw', 'Huge daily prizes!', 5000, 25, 25, datetime('now', '+1 hour'), datetime('now', '+24 hours'), datetime('now', '+24 hours'), 'upcoming', 5),
  ('raffle_3', 'Weekly Bonanza', 'The biggest weekly raffle', 25000, 50, 50, datetime('now', '+1 day'), datetime('now', '+7 days'), datetime('now', '+7 days'), 'upcoming', 10);