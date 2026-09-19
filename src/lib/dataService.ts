import { supabase, isSupabaseConfigured } from './supabase';
import { Issue, IssueStatus, UserProfile } from '../types';

export class DataService {
  // Validate Access Code against Supabase access_codes table
  static async validateAccessCode(codeStr: string): Promise<{
    success: boolean;
    role?: 'resident' | 'maintenance';
    apartment_id?: string;
    error?: string;
  }> {
    const cleanCode = (codeStr || '').trim().toUpperCase();

    if (!cleanCode) {
      return { success: false, error: 'Please enter an access code.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.'
      };
    }

    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('id, code, role, apartment_id, is_used, expires_at')
        .ilike('code', cleanCode)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Access code validation query error:', error.message);
        return { success: false, error: 'Unable to verify access code. Please try again.' };
      }

      if (!data) {
        return {
          success: false,
          error: 'Invalid access code. Please check the code provided by your apartment team.'
        };
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return {
          success: false,
          error: 'This access code has expired. Please request a new one from your apartment team.'
        };
      }

      if (data.is_used) {
        return {
          success: false,
          error: 'This access code has already been used.'
        };
      }

      return {
        success: true,
        role: data.role as 'resident' | 'maintenance',
        apartment_id: data.apartment_id || (data.role === 'resident' ? 'Oakridge Heights, Apt 4B' : 'Oakridge Heights Facility Staff'),
      };
    } catch (err: any) {
      console.error('[DataService] validateAccessCode error:', err);
      return { success: false, error: err.message || 'Error validating access code.' };
    }
  }

  // Get Profile by ID directly from Supabase
  static async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Failed to fetch profile:', error.message);
        return null;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error('[DataService] getProfile exception:', err);
      return null;
    }
  }

  // Save / Update Profile in Supabase
  static async saveProfile(profile: UserProfile): Promise<UserProfile> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Failed to save profile:', error.message);
      throw error;
    }

    return data as UserProfile;
  }

  // Get Issues from Supabase
  static async getIssues(user: UserProfile): Promise<Issue[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('[DataService] getIssues: Supabase not configured');
      return [];
    }

    try {
      let query = supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.role === 'resident') {
        query = query.eq('resident_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[Supabase] Failed to load issues:', error.message);
        return [];
      }
      return (data || []) as Issue[];
    } catch (err) {
      console.error('[DataService] getIssues exception:', err);
      return [];
    }
  }

  // Get Single Issue by ID from Supabase
  static async getIssueById(issueId: string): Promise<Issue | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', issueId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Failed to load issue by id:', error.message);
        return null;
      }
      return data as Issue | null;
    } catch (err) {
      console.error('[DataService] getIssueById exception:', err);
      return null;
    }
  }

  // Create Issue in Supabase
  static async createIssue(
    newIssue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'submitted_at' | 'status'>
  ): Promise<Issue> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please ensure environment variables are set.');
    }

    const now = new Date().toISOString();
    const insertPayload = {
      resident_id: newIssue.resident_id,
      title: newIssue.title,
      category: newIssue.category,
      description: newIssue.description,
      location: newIssue.location,
      photo_url: newIssue.photo_url || null,
      status: 'submitted',
      submitted_at: now,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('issues')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Issue insertion failed:', error.message);
      throw new Error(`Failed to submit issue: ${error.message}`);
    }

    return data as Issue;
  }

  // Update Issue Status in Supabase (Staff only)
  static async updateIssueStatus(issueId: string, nextStatus: IssueStatus): Promise<Issue> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const now = new Date().toISOString();
    const updates: Partial<Issue> = {
      status: nextStatus,
      updated_at: now,
    };

    if (nextStatus === 'viewed') {
      updates.viewed_at = now;
    } else if (nextStatus === 'in_progress') {
      updates.in_progress_at = now;
    } else if (nextStatus === 'resolved') {
      updates.resolved_at = now;
    }

    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Issue update failed:', error.message);
      throw new Error(`Failed to update issue: ${error.message}`);
    }

    return data as Issue;
  }

  // Upload Photo to Supabase Storage
  static async uploadPhoto(file: File): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('issue-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Photo upload failed:', uploadError.message);
      // If bucket is not accessible, provide fallback via data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicData } = supabase.storage
      .from('issue-photos')
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      throw new Error('Failed to retrieve public URL for uploaded photo.');
    }

    return publicData.publicUrl;
  }
}
