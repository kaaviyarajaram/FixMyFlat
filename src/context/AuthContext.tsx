import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, UserAccount } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DataService } from '../lib/dataService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signup: (name: string, email: string, pass: string, accessCode: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Sync with persistent server database (data/db.json)
        await DataService.syncWithServer();

        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await DataService.getProfile(session.user.id);
            if (profile) {
              setUser(profile);
              setLoading(false);
              return;
            }
          }
        }

        // Check local storage session only if on a protected path so root and login always open login page first
        const isProtectedPath = window.location.pathname.startsWith('/resident') || window.location.pathname.startsWith('/maintenance');
        if (isProtectedPath) {
          const localSession = localStorage.getItem('fixmyflat_current_user');
          if (localSession) {
            setUser(JSON.parse(localSession));
          }
        }
      } catch (err) {
        console.error('Session init error', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth state changes if configured
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await DataService.getProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = pass || '';

    // Validate inputs
    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please provide both email and password.' };
    }

    // 1. Authenticate against persistent Server DB API (data/db.json)
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.profile) {
          setUser(data.profile);
          localStorage.setItem('fixmyflat_current_user', JSON.stringify(data.profile));
          await DataService.saveAccount({
            id: data.profile.id,
            email: cleanEmail,
            password: cleanPass,
            profile: data.profile
          });
          return { success: true, role: data.role };
        }
      } else {
        const data = await resp.json().catch(() => null);
        if (data?.error) {
          // If server reported wrong password or no account, verify if local fallback has it
          const localAcc = DataService.getAccountByEmail(cleanEmail);
          if (localAcc) {
            const storedPass = localAcc.password;
            if (!storedPass || storedPass === cleanPass || storedPass.trim() === cleanPass.trim()) {
              setUser(localAcc.profile);
              localStorage.setItem('fixmyflat_current_user', JSON.stringify(localAcc.profile));
              return { success: true, role: localAcc.profile.role };
            }
          }
          return { success: false, error: data.error };
        }
      }
    } catch (apiErr) {
      console.warn('Server login API not reached, using local storage verification:', apiErr);
    }

    // 2. Supabase check if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (!error && data?.user) {
          const profile = await DataService.getProfile(data.user.id);
          if (profile) {
            setUser(profile);
            localStorage.setItem('fixmyflat_current_user', JSON.stringify(profile));
            return { success: true, role: profile.role };
          }
        }
      } catch (err: any) {
        console.warn('Supabase auth attempt, falling back to local accounts:', err);
      }
    }

    // 3. Local storage fallback
    const account = DataService.getAccountByEmail(cleanEmail);
    if (account) {
      const storedPass = account.password;
      if (!storedPass || storedPass === cleanPass || storedPass.trim() === cleanPass.trim()) {
        if (!storedPass) {
          account.password = cleanPass;
          await DataService.saveAccount(account);
        }
        setUser(account.profile);
        localStorage.setItem('fixmyflat_current_user', JSON.stringify(account.profile));
        return { success: true, role: account.profile.role };
      } else {
        return { success: false, error: 'Incorrect password. Please verify your password and try again.' };
      }
    }

    // 4. Default accounts check
    if (cleanEmail === 'alex.rivera@oakridge.com') {
      if (cleanPass === 'Securepass123!' || cleanPass.trim() === 'Securepass123!') {
        const profile: UserProfile = {
          id: 'user-resident-1',
          name: 'Alex Walter',
          email: cleanEmail,
          role: 'resident',
          apartment_id: 'Oakridge Heights, Apt 4B',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem('fixmyflat_current_user', JSON.stringify(profile));
        return { success: true, role: 'resident' };
      } else {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
    }

    if (cleanEmail === 'graham.garette@oakridge.com' || cleanEmail.includes('staff')) {
      if (cleanPass === 'Securepass123!' || cleanPass.trim() === 'Securepass123!') {
        const profile: UserProfile = {
          id: 'user-staff-1',
          name: 'Graham Garette',
          email: cleanEmail,
          role: 'maintenance',
          apartment_id: 'Oakridge Heights Facility Team',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem('fixmyflat_current_user', JSON.stringify(profile));
        return { success: true, role: 'maintenance' };
      } else {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
    }

    return {
      success: false,
      error: 'No account found with this email. Please check your email or click Sign up to create an account.'
    };
  };

  const signup = async (
    name: string,
    email: string,
    pass: string,
    accessCode: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanCode = (accessCode || '').trim().toUpperCase();

    // 1. Basic validation
    if (!cleanName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (pass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (!cleanCode) {
      return { success: false, error: 'Access code is required to register.' };
    }

    // 2. Validate access code
    const validation = await DataService.validateAccessCode(cleanCode);
    if (!validation.success || !validation.role) {
      return {
        success: false,
        error: validation.error || 'Invalid access code. Please use the code given by your apartment team.'
      };
    }

    const assignedRole: UserRole = validation.role;
    const assignedApt = validation.apartment_id || (assignedRole === 'resident' ? 'Oakridge Heights, Apt 4B' : 'Oakridge Heights Facility Staff');
    const avatarUrl = assignedRole === 'resident'
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    let createdUserId = 'user-' + Date.now();

    // 3. Register in Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: cleanName,
              role: assignedRole,
              apartment_id: assignedApt,
            }
          }
        });

        if (authData?.user) {
          createdUserId = authData.user.id;
          console.log('[Supabase Auth] Registered user in auth.users:', authData.user.id);
          
          // Insert into public.profiles in Supabase
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            name: cleanName,
            email: cleanEmail,
            role: assignedRole,
            apartment_id: assignedApt,
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
          });

          if (profileError) {
            console.warn('[Supabase Profiles] Error inserting profile:', profileError.message);
          } else {
            console.log('[Supabase Profiles] Profile saved in public.profiles table');
          }
        } else if (authError) {
          console.warn('[Supabase Auth] signup note:', authError.message);
        }
      } catch (err: any) {
        console.warn('Supabase auth call failed, continuing with local persistence:', err);
      }
    }

    // 4. Also persist to Server DB API (data/db.json)
    try {
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: pass,
          accessCode: cleanCode
        })
      });
    } catch (apiErr) {
      console.warn('Server signup API not reached:', apiErr);
    }

    // 5. Create and persist UserProfile & UserAccount with password locally
    const newProfile: UserProfile = {
      id: createdUserId,
      name: cleanName,
      email: cleanEmail,
      role: assignedRole,
      apartment_id: assignedApt,
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
    };

    const newAccount: UserAccount = {
      id: newProfile.id,
      email: cleanEmail,
      password: pass,
      profile: newProfile,
    };

    await DataService.saveAccount(newAccount);
    setUser(newProfile);
    localStorage.setItem('fixmyflat_current_user', JSON.stringify(newProfile));

    return { success: true, role: assignedRole };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('fixmyflat_current_user');
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const updated = await DataService.getProfile(user.id);
      if (updated) {
        setUser(updated);
        localStorage.setItem('fixmyflat_current_user', JSON.stringify(updated));
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
