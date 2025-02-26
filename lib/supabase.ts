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

function config(arg0: { path: any; }) {
  throw new Error('Function not implemented.');
}
