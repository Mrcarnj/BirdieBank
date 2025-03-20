-- Add net_score column to round_players table
ALTER TABLE round_players ADD COLUMN IF NOT EXISTS net_score INTEGER;

-- Update existing records to calculate net_score where possible
-- This is a placeholder and would need to be customized based on your actual data
-- UPDATE round_players SET net_score = total_score - handicap_adjustment WHERE total_score IS NOT NULL;

COMMENT ON COLUMN round_players.net_score IS 'Net score after handicap adjustments'; 