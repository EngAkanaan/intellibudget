import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      console.log('📝 Attempting sign up for:', email);
      
      // Get the correct redirect URL - use production URL if available, otherwise use current origin
      const getRedirectUrl = () => {
        // Check if we're in production (Vercel or custom domain)
        if (import.meta.env.VITE_APP_URL) {
          return import.meta.env.VITE_APP_URL;
        }
        // Check if current origin is localhost - use production URL from env or fallback
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          // In development, use the production URL for email links
          // This ensures emails work on phones even when testing locally
          return import.meta.env.VITE_PRODUCTION_URL || window.location.origin;
        }
        // Otherwise use current origin (production)
        return window.location.origin;
      };
      
      const redirectUrl = getRedirectUrl();
      console.log('📧 Email redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: redirectUrl,
          // Include user metadata (name, last name)
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
            full_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '',
          }
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
        throw error;
      }
      
      console.log('✅ Sign up successful:', data);
      
      // Note: In Supabase, when email confirmation is enabled,
      // the user object will be null until email is verified
      // The email will be sent automatically
      return data;
    } catch (err: any) {
      console.error('❌ Sign up exception:', err);
      // If it's a network error, provide more helpful message
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        throw new Error('Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
      }
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    return data;
  };

  const signOut = async () => {
    // Always clear local state first
    setUser(null);
    setSession(null);
    
    // Try to sign out from Supabase (but don't wait for it or throw errors)
    // This is a "fire and forget" approach - we clear state immediately
    supabase.auth.signOut({ scope: 'local' }).catch(() => {
      // Silently ignore all errors - logout is already complete since we cleared state
      // The 403 errors are harmless and don't affect functionality
    });
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      }
    });
    if (error) throw error;
  };

  const updateProfile = async (firstName: string, lastName: string) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      }
    });
    if (error) throw error;
    // Refresh user data
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    setUser(updatedUser);
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });
    if (error) throw error;
    // Note: Supabase will send a confirmation email to the new address
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resendVerificationEmail, updateProfile, updateEmail, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

