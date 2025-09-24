-- Add missing resolved column to price_predictions table
ALTER TABLE price_predictions ADD COLUMN resolved BOOLEAN DEFAULT FALSE;