import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DataService } from '../lib/dataService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signup: (
    name: string,
    email: string,
    pass: string,
    accessCode: string
  ) => Promise<{
    success: boolean;
    role?: UserRole;
    error?: string;
    requiresEmailConfirmation?: boolean;
    message?: string;
  }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session exclusively from Supabase
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Supabase Auth] Failed to get session:', error.message);
        }

        if (session?.user && isMounted) {
          let profile = await DataService.getProfile(session.user.id);
          if (!profile) {
            // If profile does not exist yet, build from user_metadata
            const meta = session.user.user_metadata || {};
            const userRole: UserRole = meta.role === 'maintenance' ? 'maintenance' : 'resident';
            const newProfile: UserProfile = {
              id: session.user.id,
              name: meta.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              role: userRole,
              apartment_id: meta.apartment_id || (userRole === 'resident' ? 'Oakridge Heights, Apt 4B' : 'Oakridge Heights Facility Staff'),
              avatar_url: meta.avatar_url,
              created_at: session.user.created_at || new Date().toISOString(),
            };
            profile = await DataService.saveProfile(newProfile);
          }
          if (isMounted) {
            setUser(profile);
          }
        }
      } catch (err) {
        console.error('[Supabase Auth] Session initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen to real-time auth changes from Supabase
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          if (isMounted) setUser(null);
        } else if (session?.user) {
          const profile = await DataService.getProfile(session.user.id);
          if (isMounted && profile) {
            setUser(profile);
          }
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Login exclusively through Supabase Auth
  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = pass || '';

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your Vercel Project Settings.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        console.error('[Supabase Auth] Login failed:', error.message);
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return { success: false, error: 'Incorrect email or password. Please verify your credentials and try again.' };
        }
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { success: false, error: 'Your email has not been confirmed yet. Please check your inbox for the confirmation link.' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed: no user returned by Supabase.' };
      }

      // Fetch user profile from Supabase profiles table
      let profile = await DataService.getProfile(data.user.id);

      if (!profile) {
        const meta = data.user.user_metadata || {};
        const userRole: UserRole = meta.role === 'maintenance' ? 'maintenance' : 'resident';
        const newProfile: UserProfile = {
          id: data.user.id,
          name: meta.full_name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: userRole,
          apartment_id: meta.apartment_id || (userRole === 'resident' ? 'Oakridge Heights, Apt 4B' : 'Oakridge Heights Facility Staff'),
          avatar_url: meta.avatar_url || (userRole === 'resident'
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
          created_at: data.user.created_at || new Date().toISOString(),
        };
        profile = await DataService.saveProfile(newProfile);
      }

      setUser(profile);
      return { success: true, role: profile.role };
    } catch (err: any) {
      console.error('[Supabase Auth] Login error:', err);
      return { success: false, error: err.message || 'Login failed. Please try again.' };
    }
  };

  // Sign up exclusively through Supabase Auth
  const signup = async (
    name: string,
    email: string,
    pass: string,
    accessCode: string
  ): Promise<{
    success: boolean;
    role?: UserRole;
    error?: string;
    requiresEmailConfirmation?: boolean;
    message?: string;
  }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanCode = (accessCode || '').trim().toUpperCase();

    // 1. Basic validation
    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (pass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (!cleanCode) {
      return { success: false, error: 'Please enter an access code.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your Vercel Project Settings.'
      };
    }

    // 2. Validate access code against Supabase database
    const codeValidation = await DataService.validateAccessCode(cleanCode);
    if (!codeValidation.success || !codeValidation.role) {
      return {
        success: false,
        error: codeValidation.error || 'Invalid access code. Please check the code provided by your apartment team.'
      };
    }

    const assignedRole: UserRole = codeValidation.role;
    const assignedApt =
      codeValidation.apartment_id ||
      (assignedRole === 'resident' ? 'Oakridge Heights, Apt 4B' : 'Oakridge Heights Facility Staff');
    const avatarUrl =
      assignedRole === 'resident'
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    // 3. Register user with Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
            role: assignedRole,
            apartment_id: assignedApt,
            avatar_url: avatarUrl,
          },
        },
      });

      if (authError) {
        console.error('[Supabase Auth] SignUp failed:', authError.message);
        if (authError.message.toLowerCase().includes('already registered')) {
          return {
            success: false,
            error: 'An account with this email already exists. Please log in instead.'
          };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Signup failed: no user returned by Supabase.' };
      }

      // 4. Ensure profile is saved in public.profiles table
      const profileToSave: UserProfile = {
        id: authData.user.id,
        name: cleanName,
        email: cleanEmail,
        role: assignedRole,
        apartment_id: assignedApt,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
      };

      try {
        await DataService.saveProfile(profileToSave);
      } catch (profErr) {
        console.warn('[Supabase Profiles] Profile upsert note (trigger may have created it):', profErr);
      }

      // Check if email confirmation is required
      const hasSession = Boolean(authData.session);
      const isConfirmed = Boolean(authData.user.confirmed_at || authData.user.email_confirmed_at);

      if (hasSession || isConfirmed) {
        setUser(profileToSave);
        return { success: true, role: assignedRole };
      } else {
        return {
          success: true,
          role: assignedRole,
          requiresEmailConfirmation: true,
          message: 'Account created! Please check your email to confirm your account before logging in.'
        };
      }
    } catch (err: any) {
      console.error('[Supabase Auth] SignUp exception:', err);
      return { success: false, error: err.message || 'Signup failed. Please try again.' };
    }
  };

  // Sign out from Supabase
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[Supabase Auth] Sign out error:', err);
      }
    }
    setUser(null);
  };

  // Refresh profile from Supabase
  const refreshProfile = async () => {
    if (user?.id) {
      const updated = await DataService.getProfile(user.id);
      if (updated) {
        setUser(updated);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
