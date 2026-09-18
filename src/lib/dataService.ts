import { supabase, isSupabaseConfigured } from './supabase';
import { Issue, IssueStatus, UserProfile, AccessCode, UserAccount } from '../types';

// Default initial data matching Figma screens and predefined codes
const INITIAL_ACCESS_CODES: AccessCode[] = [
  { id: 'code-res-1', code: 'RESIDENT-01', role: 'resident', apartment_id: 'Oakridge Heights, Apt 4B', is_used: false },
  { id: 'code-staff-1', code: 'STAFF-01', role: 'maintenance', apartment_id: 'Oakridge Heights Facility Staff', is_used: false },
  { id: 'code-res-2', code: 'OAK-4B-RES', role: 'resident', apartment_id: 'Oakridge Heights, Apt 4B', is_used: false },
  { id: 'code-staff-2', code: 'OAK-STAFF-1', role: 'maintenance', apartment_id: 'Oakridge Heights Facility Staff', is_used: false },
];

const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user-resident-1',
    name: 'Alex Walter',
    email: 'alex.rivera@oakridge.com',
    role: 'resident',
    apartment_id: 'Oakridge Heights, Apt 4B',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-staff-1',
    name: 'Graham Garette',
    email: 'graham.garette@oakridge.com',
    role: 'maintenance',
    apartment_id: 'Oakridge Heights, Facility Staff',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-resident-1',
    email: 'alex.rivera@oakridge.com',
    password: 'Securepass123!',
    profile: INITIAL_PROFILES[0],
  },
  {
    id: 'user-staff-1',
    email: 'graham.garette@oakridge.com',
    password: 'Securepass123!',
    profile: INITIAL_PROFILES[1],
  },
];

const INITIAL_ISSUES: Issue[] = [
  {
    id: 'issue-1',
    resident_id: 'user-resident-1',
    resident_name: 'Alex Walter',
    title: 'Water leakage under Tank',
    category: 'Plumbing',
    description: 'There is continuous water dripping under the main overhead storage tank on the roof. It is pooling near the edge.',
    location: 'Apt 4B - Roof Top',
    photo_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
    status: 'viewed',
    submitted_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    viewed_at: new Date(Date.now() - 25 * 3600000).toISOString(),
    in_progress_at: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 3600000).toISOString(),
  },
  {
    id: 'issue-2',
    resident_id: 'user-resident-1',
    resident_name: 'Alex Walter',
    title: 'Broken staircase light',
    category: 'Electrical',
    description: 'The staircase light is not working, making the area dark and difficult to use, especially at night. Please check and repair the light as soon as possible.',
    location: '4th Floor Corridor - Stairwell B',
    photo_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80',
    status: 'in_progress', // Displayed as "Under Process" in Figma
    submitted_at: new Date(Date.now() - 28 * 3600000).toISOString(),
    viewed_at: new Date(Date.now() - 27 * 3600000).toISOString(),
    in_progress_at: new Date(Date.now() - 10 * 60000).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 28 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'issue-3',
    resident_id: 'user-resident-1',
    resident_name: 'Alex Walter',
    title: 'Lift not working',
    category: 'Electrical',
    description: 'Lift No 3 is stuck on the ground floor with doors refusing to open automatically.',
    location: 'Apt 2B - Lift No : 3',
    photo_url: undefined,
    status: 'submitted',
    submitted_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    viewed_at: null,
    in_progress_at: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'issue-4',
    resident_id: 'user-resident-2',
    resident_name: 'Sarah Connor',
    title: 'Lift shuddering & noisy',
    category: 'Mechanical',
    description: 'Lift No 4 is making unusual grinding sounds when descending between floors 3 and 1.',
    location: 'Apt 1B - Lift No : 4',
    photo_url: undefined,
    status: 'submitted',
    submitted_at: new Date(Date.now() - 27 * 3600000).toISOString(),
    viewed_at: null,
    in_progress_at: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 27 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 27 * 3600000).toISOString(),
  },
  {
    id: 'issue-5',
    resident_id: 'user-resident-1',
    resident_name: 'Alex Walter',
    title: 'Main lobby intercom static',
    category: 'Electrical',
    description: 'Intercom connection to gate is buzzing and inaudible.',
    location: 'Apt 4B - Lift No : 4',
    photo_url: undefined,
    status: 'resolved',
    submitted_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    viewed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    in_progress_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

// Local Storage Helper
const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(`fixmyflat_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(`fixmyflat_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage error', e);
  }
};

export class DataService {
  // Synchronize local state with server disk database (data/db.json)
  static async syncWithServer(): Promise<void> {
    try {
      const resp = await fetch('/api/db');
      if (resp.ok) {
        const db = await resp.json();
        if (db.accounts && Array.isArray(db.accounts)) {
          localStorage.setItem('fixmyflat_accounts', JSON.stringify(db.accounts));
          const profiles = db.accounts.map((a: any) => a.profile).filter(Boolean);
          if (profiles.length > 0) {
            localStorage.setItem('fixmyflat_profiles', JSON.stringify(profiles));
          }
        }
        if (db.issues && Array.isArray(db.issues)) {
          localStorage.setItem('fixmyflat_issues', JSON.stringify(db.issues));
        }
        if (db.access_codes && Array.isArray(db.access_codes)) {
          localStorage.setItem('fixmyflat_access_codes', JSON.stringify(db.access_codes));
        }
      }
    } catch {
      // Offline fallback, proceed silently with localStorage
    }
  }

  // Validate Access Code
  static async validateAccessCode(codeStr: string): Promise<{ success: boolean; role?: 'resident' | 'maintenance'; apartment_id?: string; error?: string }> {
    const cleanCode = (codeStr || '').trim().toUpperCase();

    // 1. First-class support for predefined codes and common variations
    if (
      cleanCode === 'RESIDENT-01' ||
      cleanCode === 'RESIDENT' ||
      cleanCode === 'RESIDENT01' ||
      cleanCode === 'RES-01' ||
      cleanCode === 'RESIDENT-1' ||
      cleanCode === 'OAK-4B-RES'
    ) {
      return { success: true, role: 'resident', apartment_id: 'Oakridge Heights, Apt 4B' };
    }

    if (
      cleanCode === 'STAFF-01' ||
      cleanCode === 'STAFF' ||
      cleanCode === 'STAFF01' ||
      cleanCode === 'STAFF-1' ||
      cleanCode === 'MAINTENANCE' ||
      cleanCode === 'OAK-STAFF-1'
    ) {
      return { success: true, role: 'maintenance', apartment_id: 'Oakridge Heights Facility Staff' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('verify_and_claim_access_code', {
          access_code_input: cleanCode,
          claiming_user_id: '00000000-0000-0000-0000-000000000000' // preview validation before signup
        });
        if (error) {
          const { data: codeData, error: selectErr } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', cleanCode)
            .maybeSingle();

          if (selectErr || !codeData) {
            return { success: false, error: 'Invalid access code. Please use RESIDENT-01 or STAFF-01.' };
          }
          if (codeData.is_used) {
            return { success: false, error: 'This access code has already been claimed.' };
          }
          return { success: true, role: codeData.role, apartment_id: codeData.apartment_id };
        }
        if (!data || !data[0]?.success) {
          return { success: false, error: data?.[0]?.message || 'Invalid access code. Please use RESIDENT-01 or STAFF-01.' };
        }
        return { success: true, role: data[0].role, apartment_id: data[0].apartment_id };
      } catch (err: any) {
        console.warn('Supabase code validation failed, falling back to local verification', err);
      }
    }

    // Local / offline verification
    let codes = getStored<AccessCode[]>('access_codes', INITIAL_ACCESS_CODES);
    const found = codes.find(c => c.code.toUpperCase() === cleanCode);
    if (found) {
      return { success: true, role: found.role, apartment_id: found.apartment_id };
    }

    return {
      success: false,
      error: 'Invalid access code. Please enter RESIDENT-01 for Resident or STAFF-01 for Maintenance.'
    };
  }

  // Save Account (stores credentials and profile in server DB and localStorage)
  static async saveAccount(account: UserAccount): Promise<void> {
    try {
      const raw = localStorage.getItem('fixmyflat_accounts');
      let accounts: UserAccount[] = raw ? JSON.parse(raw) : [...INITIAL_ACCOUNTS];
      const idx = accounts.findIndex(a => a.email.trim().toLowerCase() === account.email.trim().toLowerCase());
      if (idx >= 0) {
        accounts[idx] = account;
      } else {
        accounts.push(account);
      }
      localStorage.setItem('fixmyflat_accounts', JSON.stringify(accounts));
      // Also ensure profile is saved in profiles table
      await this.saveProfile(account.profile);
    } catch (e) {
      console.error('Error saving account to localStorage', e);
    }
  }

  // Find Account by Email (checks accounts store, profiles store, and defaults)
  static getAccountByEmail(email: string): UserAccount | null {
    try {
      const clean = email.trim().toLowerCase();
      const raw = localStorage.getItem('fixmyflat_accounts');
      let accounts: UserAccount[] = raw ? JSON.parse(raw) : [...INITIAL_ACCOUNTS];
      
      const found = accounts.find(a => a.email.trim().toLowerCase() === clean);
      if (found) return found;

      // Fallback check in profiles if user was created earlier
      const profilesRaw = localStorage.getItem('fixmyflat_profiles');
      const profiles: UserProfile[] = profilesRaw ? JSON.parse(profilesRaw) : INITIAL_PROFILES;
      const foundProf = profiles.find(p => p.email.trim().toLowerCase() === clean);
      if (foundProf) {
        return {
          id: foundProf.id,
          email: foundProf.email,
          password: '',
          profile: foundProf,
        };
      }

      // Check initial default accounts
      return INITIAL_ACCOUNTS.find(a => a.email.trim().toLowerCase() === clean) || null;
    } catch {
      return null;
    }
  }

  // Get Profile by ID
  static async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (data && !error) return data as UserProfile;
      } catch (err) {
        console.error('Failed to fetch profile from Supabase', err);
      }
    }

    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    return profiles.find(p => p.id === userId) || null;
  }

  // Save / Update Profile
  static async saveProfile(profile: UserProfile): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(profile)
          .select()
          .single();
        if (data && !error) return data as UserProfile;
      } catch (err) {
        console.error('Failed to save profile to Supabase', err);
      }
    }

    const profiles = getStored<UserProfile[]>('profiles', INITIAL_PROFILES);
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    setStored('profiles', profiles);
    return profile;
  }

  // Get Issues
  static async getIssues(user: UserProfile): Promise<Issue[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (user.role === 'resident') {
          query = query.eq('resident_id', user.id);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data as Issue[];
        }
      } catch (err) {
        console.warn('Failed to load issues from Supabase, using local data', err);
      }
    }

    const issues = getStored<Issue[]>('issues', INITIAL_ISSUES);
    if (user.role === 'resident') {
      return issues.filter(i => i.resident_id === user.id);
    }
    return issues;
  }

  // Get Single Issue by ID
  static async getIssueById(issueId: string): Promise<Issue | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .eq('id', issueId)
          .maybeSingle();
        if (!error && data) {
          return data as Issue;
        }
      } catch (err) {
        console.warn('Failed to load issue by id from Supabase', err);
      }
    }

    const issues = getStored<Issue[]>('issues', INITIAL_ISSUES);
    return issues.find(i => i.id === issueId) || null;
  }

  // Create Issue
  static async createIssue(newIssue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'submitted_at' | 'status'>): Promise<Issue> {
    const now = new Date().toISOString();
    const issueToSave: Issue = {
      ...newIssue,
      id: 'issue-' + Date.now(),
      status: 'submitted',
      submitted_at: now,
      viewed_at: null,
      in_progress_at: null,
      resolved_at: null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .insert({
            resident_id: issueToSave.resident_id,
            title: issueToSave.title,
            category: issueToSave.category,
            description: issueToSave.description,
            location: issueToSave.location,
            photo_url: issueToSave.photo_url,
            status: 'submitted',
            submitted_at: now,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();
        if (!error && data) {
          return data as Issue;
        }
      } catch (err) {
        console.error('Supabase issue insertion failed, saving locally', err);
      }
    }

    const issues = getStored<Issue[]>('issues', INITIAL_ISSUES);
    issues.unshift(issueToSave);
    setStored('issues', issues);
    return issueToSave;
  }

  // Update Issue Status (Staff only)
  static async updateIssueStatus(issueId: string, nextStatus: IssueStatus): Promise<Issue> {
    const now = new Date().toISOString();
    const updates: Partial<Issue> = {
      status: nextStatus,
      updated_at: now,
    };

    if (nextStatus === 'viewed') {
      updates.viewed_at = now;
    } else if (nextStatus === 'in_progress') {
      updates.in_progress_at = now;
      if (!updates.viewed_at) updates.viewed_at = now;
    } else if (nextStatus === 'resolved') {
      updates.resolved_at = now;
      if (!updates.in_progress_at) updates.in_progress_at = now;
      if (!updates.viewed_at) updates.viewed_at = now;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .update(updates)
          .eq('id', issueId)
          .select()
          .single();
        if (!error && data) {
          return data as Issue;
        }
      } catch (err) {
        console.error('Supabase issue update failed, saving locally', err);
      }
    }

    const issues = getStored<Issue[]>('issues', INITIAL_ISSUES);
    const index = issues.findIndex(i => i.id === issueId);
    if (index >= 0) {
      issues[index] = {
        ...issues[index],
        ...updates,
      };
      setStored('issues', issues);
      return issues[index];
    }
    throw new Error('Issue not found');
  }

  // Upload Photo
  static async uploadPhoto(file: File): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      try {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('issue-photos')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('issue-photos')
            .getPublicUrl(filePath);
          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Storage upload failed, falling back to Data URL', err);
      }
    }

    // Convert file to Base64 data URL for instant display and persistence
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
