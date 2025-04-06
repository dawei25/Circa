-- Create a table for user profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  identity_statement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policy for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a table for habits
CREATE TABLE IF NOT EXISTS public.habits (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  schedule JSONB NOT NULL DEFAULT '{"daily": true}'::jsonb,
  location_required BOOLEAN DEFAULT FALSE,
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policy for habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own habits"
  ON public.habits
  USING (auth.uid() = user_id);

-- Create a table for habit logs (completions)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policy for habit logs
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own habit logs"
  ON public.habit_logs
  USING (
    auth.uid() = (
      SELECT user_id FROM public.habits WHERE id = habit_logs.habit_id
    )
  );

-- Add unique constraint to prevent duplicate logs for the same habit on the same day
ALTER TABLE public.habit_logs
  ADD CONSTRAINT unique_habit_log UNIQUE (habit_id, completed_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to tables
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp(); 