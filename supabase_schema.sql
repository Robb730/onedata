-- ──────────────────────────────────────────────────────────────
-- supabase_schema.sql
-- Run this script in your Supabase SQL Editor to create the 
-- necessary tables for the ONE DATA project.
-- ──────────────────────────────────────────────────────────────

-- 1. Create the enrollment_data table
-- We use JSONB columns for the grade breakdowns to handle the 
-- complex M/F structure without needing 200+ individual columns.
CREATE TABLE IF NOT EXISTS enrollment_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id varchar(50) NOT NULL,
  school_name varchar(255) NOT NULL,
  school_type varchar(50),
  category varchar(50) NOT NULL, -- e.g., 'PUBLIC' or 'PRIVATE'
  school_year varchar(20) NOT NULL,
  
  -- JSONB columns for exact grade/gender breakdowns
  elementary_data jsonb,
  junior_high_data jsonb,
  senior_high_s1_data jsonb,
  senior_high_s2_data jsonb,
  
  grand_total integer DEFAULT 0,
  
  -- Metadata
  uploaded_by varchar(255),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create indexes for faster queries (e.g., filtering by year or school)
CREATE INDEX IF NOT EXISTS idx_enrollment_data_school_year ON enrollment_data (school_year);
CREATE INDEX IF NOT EXISTS idx_enrollment_data_school_id ON enrollment_data (school_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_data_category ON enrollment_data (category);

-- 3. Set up Row Level Security (RLS) policies
-- This fixes the 'new row violates row-level security policy' error
ALTER TABLE enrollment_data ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the data
CREATE POLICY "Allow read access to all users" ON enrollment_data 
FOR SELECT USING (true);

-- Allow anyone to insert data
CREATE POLICY "Allow insert access to all users" ON enrollment_data 
FOR INSERT WITH CHECK (true);

-- Allow anyone to update their data (optional, useful for development)
CREATE POLICY "Allow update access to all users" ON enrollment_data 
FOR UPDATE USING (true);

-- Allow anyone to delete data (optional, useful for development)
CREATE POLICY "Allow delete access to all users" ON enrollment_data 
FOR DELETE USING (true);


-- Performance Indicators Data
CREATE TABLE IF NOT EXISTS performance_indicators_data (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id integer REFERENCES files(id) ON DELETE CASCADE,
    school_year text NOT NULL,
    sheet_name text NOT NULL,
    headers_main jsonb,
    headers_sub jsonb,
    total_row jsonb,
    male_row jsonb,
    female_row jsonb,
    uploaded_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE (file_id, sheet_name)
);

CREATE INDEX IF NOT EXISTS idx_pid_school_year ON performance_indicators_data(school_year);
CREATE INDEX IF NOT EXISTS idx_pid_sheet_name ON performance_indicators_data(sheet_name);


-- RLS Policies for Performance Indicators Data
ALTER TABLE performance_indicators_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON performance_indicators_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON performance_indicators_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON performance_indicators_data FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON performance_indicators_data FOR DELETE TO authenticated USING (true);
