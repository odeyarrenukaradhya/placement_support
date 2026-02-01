-- Run this in Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Colleges Table
create table public.colleges (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  status text null default 'active'::text,
  created_at timestamp with time zone null default now(),
  constraint colleges_pkey primary key (id)
) TABLESPACE pg_default;

-- 3. Create Users Table
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'tpo', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  email text not null,
  password_hash text not null,
  role public.user_role not null,
  college_id uuid null,
  created_at timestamp with time zone null default now(),
  admin_secret_hash text null,
  usn text null,
  section text null,
  year text null,
  branch text null,
  last_login_at timestamp with time zone null,
  failed_login_attempts integer null default 0,
  locked_until timestamp with time zone null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_college_id_fkey foreign KEY (college_id) references colleges (id),
  constraint admin_secret_required check (
    (
      (role <> 'admin'::user_role)
      or (admin_secret_hash is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;

-- 4. Create Login OTPs Table
create table public.login_otps (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  otp_hash text not null,
  expires_at timestamp with time zone not null,
  attempts integer not null default 0,
  used boolean not null default false,
  created_at timestamp with time zone null default now(),
  constraint login_otps_pkey primary key (id),
  constraint login_otps_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint otp_expires_future check ((expires_at > created_at))
) TABLESPACE pg_default;

create index IF not exists idx_login_otps_user_id on public.login_otps using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_login_otps_expires_at on public.login_otps using btree (expires_at) TABLESPACE pg_default;

-- 4. Create Exams Table
create table public.exams (
  id uuid not null default extensions.uuid_generate_v4 (),
  college_id uuid null,
  title text not null,
  code text unique,
  duration integer not null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  constraint exams_pkey primary key (id),
  constraint exams_college_id_fkey foreign KEY (college_id) references colleges (id),
  constraint exams_created_by_fkey foreign KEY (created_by) references users (id)
) TABLESPACE pg_default;

-- 5. Create Questions Table
create table public.questions (
  id uuid not null default extensions.uuid_generate_v4 (),
  exam_id uuid null,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  created_at timestamp with time zone null default now(),
  constraint questions_pkey primary key (id),
  constraint questions_exam_id_fkey foreign KEY (exam_id) references exams (id) on delete CASCADE
) TABLESPACE pg_default;

-- 6. Create Attempts Table
create table public.attempts (
  id uuid not null default extensions.uuid_generate_v4 (),
  exam_id uuid null,
  student_id uuid null,
  score integer null default 0,
  submitted_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint attempts_pkey primary key (id),
  constraint attempts_exam_id_fkey foreign KEY (exam_id) references exams (id),
  constraint attempts_student_id_fkey foreign KEY (student_id) references users (id)
) TABLESPACE pg_default;

-- 7. Create Integrity Logs Table
create table public.integrity_logs (
  id uuid not null default extensions.uuid_generate_v4 (),
  attempt_id uuid null,
  type text not null,
  metadata jsonb null,
  created_at timestamp with time zone null default now(),
  constraint integrity_logs_pkey primary key (id),
  constraint integrity_logs_attempt_id_fkey foreign KEY (attempt_id) references attempts (id)
) TABLESPACE pg_default;

-- 8. Create TINT Materials Table
create table public.tint_materials (
  id uuid not null default extensions.uuid_generate_v4 (),
  college_id uuid null,
  category text not null,
  title text not null,
  file_url text not null,
  created_at timestamp with time zone null default now(),
  constraint tint_materials_pkey primary key (id),
  constraint tint_materials_college_id_fkey foreign KEY (college_id) references colleges (id)
) TABLESPACE pg_default;

-- 9.
CREATE TABLE public.placements (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  student_id uuid REFERENCES public.users(id),
  company_name text NOT NULL,
  package_lpa numeric CHECK (package_lpa >= 0),
  job_role text NOT NULL,
  placed_at timestamp with time zone DEFAULT now(),
  constraint placements_pkey PRIMARY KEY (id)
);

ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

-- Students can view their own placements
CREATE POLICY "Students can view own placements" 
  ON public.placements FOR SELECT 
  TO authenticated 
  USING (student_id = auth.uid());

-- TPOs can view and manage placements for students in their college
CREATE POLICY "TPOs can manage college placements" 
  ON public.placements FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = placements.student_id 
      AND u.college_id = (SELECT college_id FROM users WHERE id = auth.uid())
      AND (SELECT role FROM users WHERE id = auth.uid()) = 'tpo'
    )
  );

-- 10.
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  student_id uuid REFERENCES public.users(id) NOT NULL,
  exam_id uuid REFERENCES public.exams(id) NOT NULL, -- Linking exam to a recruitment drive
  status text DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'selected', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  constraint applications_pkey PRIMARY KEY (id),
  UNIQUE(student_id, exam_id) -- A student can apply only once per exam/drive
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Students can view and create their own applications
CREATE POLICY "Students can manage own applications" 
  ON public.applications FOR ALL 
  TO authenticated 
  USING (student_id = auth.uid());

-- TPOs can view and update applications for exams in their college
CREATE POLICY "TPOs can manage applications for college exams" 
  ON public.applications FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM exams e 
      WHERE e.id = applications.exam_id 
      AND e.college_id = (SELECT college_id FROM users WHERE id = auth.uid())
      AND (SELECT role FROM users WHERE id = auth.uid()) = 'tpo'
    )
  );

-- 11. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_integrity_logs_attempt_id ON public.integrity_logs (attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id ON public.attempts (exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON public.attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_exams_college_id ON public.exams (college_id);
CREATE INDEX IF NOT EXISTS idx_users_college_id ON public.users (college_id);

-- 12. Create Events Table (Calendar)
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  college_id uuid REFERENCES public.colleges(id),
  title text NOT NULL,
  type text NOT NULL, -- 'exam', 'interview', 'other'
  event_date date NOT NULL,
  event_time time,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  constraint events_pkey PRIMARY KEY (id)
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone in the college can view events
CREATE POLICY "Users can view college events" 
  ON public.events FOR SELECT 
  TO authenticated 
  USING (college_id = (SELECT college_id FROM users WHERE id = auth.uid()));

-- Only TPOs can manage events
CREATE POLICY "TPOs can manage college events" 
  ON public.events FOR ALL 
  TO authenticated 
  USING (
    college_id = (SELECT college_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'tpo'
  );

CREATE INDEX IF NOT EXISTS idx_events_college_id ON public.events (college_id);

-- Insert a default college and super admin for initial setup (Optional/Manual)
-- INSERT INTO colleges (name) VALUES ('Default Technical College');
