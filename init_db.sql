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
  otp_code text null,
  otp_expires_at timestamp with time zone null,
  otp_verified boolean null default false,
  admin_secret_hash text null,
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

-- 4. Create Exams Table
create table public.exams (
  id uuid not null default extensions.uuid_generate_v4 (),
  college_id uuid null,
  title text not null,
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
  submitted_at timestamp with time zone null default now(),
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
  timestamp timestamp with time zone null default now(),
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

-- Insert a default college and super admin for initial setup (Optional/Manual)
-- INSERT INTO colleges (name) VALUES ('Default Technical College');
