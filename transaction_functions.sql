-- Create transaction functions in Supabase SQL editor
CREATE OR REPLACE FUNCTION begin_transaction() RETURNS void AS $$ 
BEGIN
  -- Begin transaction
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION commit_transaction() RETURNS void AS $$ 
BEGIN
  -- Commit transaction
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rollback_transaction() RETURNS void AS $$ 
BEGIN
  -- Rollback transaction
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;
