import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnroeynbskwfiijqqema.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucm9leW5ic2t3ZmlpanFxZW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDA4MjUsImV4cCI6MjA1NjExNjgyNX0.hJBvgieypi9Rx3VjL54NO0Tk2fPaRO0oYxUoAaNYiN4';

// Add debug logs
console.log('Supabase initialization:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, !!session);
}); 

// Create transaction helper functions
// Note: These functions require stored procedures to be created in the database
// You'll need to create these functions in your Supabase SQL editor:

/*
-- Create transaction functions in Supabase SQL editor
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  EXECUTE 'BEGIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  EXECUTE 'COMMIT';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  EXECUTE 'ROLLBACK';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

// Transaction helper class
export class SupabaseTransaction {
  /**
   * Execute a function without transaction support
   * This is a temporary workaround until proper transaction support is implemented
   * @param callback Function to execute
   * @returns Result of the callback function
   */
  static async execute<T>(callback: () => Promise<T>): Promise<T> {
    try {
      console.log('Executing database operations (without transaction support)');
      const result = await callback();
      console.log('Database operations completed successfully');
      return result;
    } catch (error) {
      console.error('Error executing database operations:', error);
      throw error;
    }
  }
}

function config(arg0: { path: any; }) {
  throw new Error('Function not implemented.');
}
