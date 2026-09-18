export type UserRole = 'resident' | 'maintenance';

export type IssueStatus = 'submitted' | 'viewed' | 'in_progress' | 'resolved';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  apartment_id?: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  profile: UserProfile;
}

export interface Issue {
  id: string;
  resident_id: string;
  resident_name?: string;
  title: string;
  category: string;
  description: string;
  location: string;
  photo_url?: string;
  status: IssueStatus;
  submitted_at: string;
  viewed_at?: string | null;
  in_progress_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessCode {
  id: string;
  code: string;
  role: UserRole;
  apartment_id: string;
  is_used: boolean;
  used_by?: string;
  expires_at?: string;
}

export interface TimelineEvent {
  step: IssueStatus;
  title: string;
  subtitle: string;
  timestamp?: string | null;
  isCompleted: boolean;
  isActive: boolean;
}
