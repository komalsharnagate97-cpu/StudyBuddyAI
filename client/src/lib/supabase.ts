import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth helpers with Supabase fallback to backend
export const signIn = async (email: string, password: string) => {
  // Use Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { 
          data: null, 
          error: { message: error.message } 
        };
      }

      return { 
        data: { user: data.user }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Network error. Please try again.' } 
      };
    }
  }

  // Fallback to backend authentication
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        data: null, 
        error: { message: data.message || 'Login failed' } 
      };
    }

    // Store user session in localStorage for backend auth
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    
    return { 
      data: { user: data.user }, 
      error: null 
    };
  } catch (error) {
    return { 
      data: null, 
      error: { message: 'Network error. Please try again.' } 
    };
  }
};

export const signOut = async () => {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    return { error };
  }
  
  // Fallback: Clear user session from localStorage
  localStorage.removeItem('auth_user');
  return { error: null };
};

export const getSession = async () => {
  if (supabase) {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }
  
  // Fallback: Check localStorage for user session
  const authUser = localStorage.getItem('auth_user');
  if (authUser) {
    return { session: { user: JSON.parse(authUser) }, error: null };
  } else {
    return { session: null, error: null };
  }
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (supabase) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return { data: { subscription } };
  }
  
  // Fallback: Check current auth state
  const authUser = localStorage.getItem('auth_user');
  if (authUser) {
    callback('SIGNED_IN', { user: JSON.parse(authUser) });
  } else {
    callback('SIGNED_OUT', null);
  }
  return { data: { subscription: { unsubscribe: () => {} } } };
};

// User Registration
export const signUp = async (email: string, password: string, name: string) => {
  // Use Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return { 
          data: null, 
          error: { message: error.message } 
        };
      }

      return { 
        data: { user: data.user }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Network error. Please try again.' } 
      };
    }
  }

  // Fallback to backend registration
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        data: null, 
        error: { message: data.message || 'Registration failed' } 
      };
    }

    return { 
      data: { user: data.user }, 
      error: null 
    };
  } catch (error) {
    return { 
      data: null, 
      error: { message: 'Network error. Please try again.' } 
    };
  }
};