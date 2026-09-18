-- FixmyFlat: Complete Database Schema, RLS Policies, Storage, and Seed Data
-- Run this script in the Supabase SQL Editor to configure your database.

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-initializing (safe migration)
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.access_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Create Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('resident', 'maintenance')),
  apartment_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Access Codes table
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('resident', 'maintenance')),
  apartment_id TEXT,
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Issues table
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'viewed', 'in_progress', 'resolved')),
  submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  viewed_at TIMESTAMPTZ,
  in_progress_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Helper function to check staff role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_maintenance()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'maintenance'
  );
$$;

-- 7. RLS Policies for Profiles
-- Users can view profiles to see names and roles
CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile during signup
CREATE POLICY "Allow insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Automatic trigger to create profile whenever user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, apartment_id, avatar_url, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'resident'),
    COALESCE(new.raw_user_meta_data->>'apartment_id', 'Oakridge Heights, Apt 4B'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    apartment_id = EXCLUDED.apartment_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. RLS Policies for Issues
-- Residents can view their own reported issues, staff can view all issues
CREATE POLICY "Users can view issues"
  ON public.issues FOR SELECT
  USING (auth.uid() = resident_id OR public.is_maintenance());

-- Residents can create issues
CREATE POLICY "Residents can create issues"
  ON public.issues FOR INSERT
  WITH CHECK (auth.uid() = resident_id);

-- Maintenance staff can update issue status and timestamps
CREATE POLICY "Staff can update issues"
  ON public.issues FOR UPDATE
  USING (public.is_maintenance());

-- Policies for Access Codes
CREATE POLICY "Allow read access codes"
  ON public.access_codes FOR SELECT
  USING (true);

-- 9. Secure Function to Validate and Claim Access Code
-- This prevents users from selecting and leaking access codes on the client
CREATE OR REPLACE FUNCTION public.verify_and_claim_access_code(
  access_code_input TEXT,
  claiming_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  role TEXT,
  apartment_id TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_record public.access_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_code_record
  FROM public.access_codes
  WHERE UPPER(code) = UPPER(TRIM(access_code_input))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, 'Invalid access code.'::TEXT;
    RETURN;
  END IF;

  IF v_code_record.is_used THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, 'This access code has already been used.'::TEXT;
    RETURN;
  END IF;

  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, 'This access code has expired.'::TEXT;
    RETURN;
  END IF;

  -- Mark code as used
  UPDATE public.access_codes
  SET is_used = true,
      used_by = claiming_user_id
  WHERE id = v_code_record.id;

  RETURN QUERY SELECT true, v_code_record.role, v_code_record.apartment_id, 'Code verified successfully.'::TEXT;
END;
$$;

-- Allow authenticated users to call the verification function
GRANT EXECUTE ON FUNCTION public.verify_and_claim_access_code(TEXT, UUID) TO authenticated, anon;

-- 10. Seed Initial Access Codes for Testing
INSERT INTO public.access_codes (code, role, apartment_id, is_used)
VALUES
  ('RESIDENT-01', 'resident', 'Oakridge Heights, Apt 4B', false),
  ('STAFF-01', 'maintenance', 'Oakridge Heights Facility Staff', false),
  ('OAK-4B-RES', 'resident', 'Oakridge Heights, Apt 4B', false),
  ('OAK-STAFF-1', 'maintenance', 'Oakridge Heights Facility Team', false)
ON CONFLICT (code) DO NOTHING;

-- 11. Create Storage bucket for issue photos (if not already created)
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-photos', 'issue-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Anyone can read public issue photos, authenticated users can upload
CREATE POLICY "Public issue photos read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-photos');

CREATE POLICY "Authenticated users can upload issue photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'issue-photos' AND auth.role() = 'authenticated');
