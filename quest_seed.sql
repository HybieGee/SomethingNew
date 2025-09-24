INSERT OR IGNORE INTO quests (id, slug, title, description, type, min_reward, max_reward, cooldown_minutes, active) VALUES
('quest1', 'daily_login', 'Daily Login', 'Log in and claim your daily reward', 'instant_reward', 50, 100, 1440, true),
('quest2', 'tap_challenge', 'Tap Challenge', 'Test your speed! Tap as fast as you can in 10 seconds', 'tap_challenge', 5, 25, 60, true),
('quest3', 'price_prediction', 'Price Prediction', 'Predict if the crypto price will go up or down in 60 seconds', 'up_down_call', 10, 50, 120, true),
('quest4', 'crypto_trivia', 'Crypto Trivia', 'Answer 5 questions about cryptocurrency and blockchain', 'trivia', 15, 40, 180, true);