-- ============================================================
-- ForcastNetwork Database Schema
-- PostgreSQL + Supabase (Auth + RLS)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  expertise_areas TEXT[] DEFAULT '{}',
  total_forecasts INTEGER DEFAULT 0,
  correct_forecasts INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FORECASTS (core entity)
-- ============================================================
CREATE TABLE public.forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 10 AND length(title) <= 200),
  description TEXT NOT NULL CHECK (length(description) >= 20),
  category TEXT NOT NULL,
  target_date TIMESTAMPTZ NOT NULL,
  predicted_outcome TEXT NOT NULL,           -- e.g. "Yes", "No", "Candidate A", "Above 3.2%"
  initial_confidence INTEGER NOT NULL CHECK (initial_confidence BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_outcome TEXT,                     -- filled on resolution
  is_correct BOOLEAN,                        -- computed on resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- External market linking (e.g. Polymarket for reference only)
  external_source TEXT,                 -- 'polymarket' | null
  external_id TEXT,
  external_slug TEXT,
  external_market_price NUMERIC,        -- snapshot of lastTradePrice (0-1) at creation time
  external_url TEXT
);

-- Index for performance
CREATE INDEX idx_forecasts_status ON public.forecasts(status);
CREATE INDEX idx_forecasts_category ON public.forecasts(category);
CREATE INDEX idx_forecasts_user ON public.forecasts(user_id);
CREATE INDEX idx_forecasts_target_date ON public.forecasts(target_date);
CREATE INDEX idx_forecasts_created ON public.forecasts(created_at DESC);
CREATE INDEX idx_forecasts_external ON public.forecasts(external_source, external_slug);

-- ============================================================
-- FOLLOWS (analyst following)
-- ============================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- ============================================================
-- COMMENTS (on forecasts)
-- ============================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_id UUID NOT NULL REFERENCES public.forecasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_forecast ON public.comments(forecast_id, created_at DESC);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_forecasts
  BEFORE UPDATE ON public.forecasts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new auth user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment / decrement follower counts
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET follower_count = follower_count + 1 
    WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET follower_count = GREATEST(follower_count - 1, 0) 
    WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_count_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_count();

-- Update profile accuracy + counts when forecast is resolved
CREATE OR REPLACE FUNCTION public.update_profile_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status = 'open' AND NEW.is_correct IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      total_forecasts = total_forecasts + 1,
      correct_forecasts = correct_forecasts + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
      accuracy = CASE 
        WHEN (total_forecasts + 1) > 0 
        THEN ROUND( ((correct_forecasts + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END))::NUMERIC / (total_forecasts + 1)) * 100 , 2)
        ELSE 0 
      END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forecast_resolution_trigger
  AFTER UPDATE ON public.forecasts
  FOR EACH ROW
  WHEN (NEW.status = 'resolved' AND OLD.status = 'open')
  EXECUTE FUNCTION public.update_profile_on_resolution();

-- Increment comment count
CREATE OR REPLACE FUNCTION public.increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forecasts 
  SET comment_count = comment_count + 1 
  WHERE id = NEW.forecast_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_count_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.increment_comment_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Forecasts: public read, only author can insert/update own (until resolved)
CREATE POLICY "Forecasts are viewable by everyone" 
  ON public.forecasts FOR SELECT USING (true);

CREATE POLICY "Users can create forecasts" 
  ON public.forecasts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own open forecasts" 
  ON public.forecasts FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'open');

-- Resolution: only the forecast creator can resolve (for this platform)
CREATE POLICY "Creators can resolve their forecasts"
  ON public.forecasts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Follows: users manage their follows
CREATE POLICY "Users can view all follows" 
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others" 
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Comments: public read + authenticated create
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" 
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete own comments (optional)
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- HELPFUL VIEWS (optional but useful)
-- ============================================================

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.accuracy,
  p.total_forecasts,
  p.correct_forecasts,
  p.follower_count,
  p.expertise_areas
FROM public.profiles p
WHERE p.total_forecasts >= 3
ORDER BY p.accuracy DESC, p.total_forecasts DESC;

-- Trending: recent open forecasts with activity (simple)
CREATE OR REPLACE VIEW public.trending_forecasts AS
SELECT 
  f.*,
  p.username AS analyst_username,
  p.full_name AS analyst_name,
  p.avatar_url AS analyst_avatar
FROM public.forecasts f
JOIN public.profiles p ON f.user_id = p.id
WHERE f.status = 'open'
ORDER BY (f.comment_count * 3 + EXTRACT(EPOCH FROM (NOW() - f.created_at)) * -0.0001) DESC
LIMIT 50;

-- Grant access
GRANT SELECT ON public.leaderboard TO authenticated, anon;
GRANT SELECT ON public.trending_forecasts TO authenticated, anon;

-- ============================================================
-- MIGRATION: Add external market linking columns (run if table already exists)
-- ============================================================
ALTER TABLE public.forecasts 
  ADD COLUMN IF NOT EXISTS external_source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS external_slug TEXT,
  ADD COLUMN IF NOT EXISTS external_market_price NUMERIC,
  ADD COLUMN IF NOT EXISTS external_url TEXT;

CREATE INDEX IF NOT EXISTS idx_forecasts_external ON public.forecasts(external_source, external_slug);

-- ============================================================
-- CATEGORIES (reference)
-- ============================================================
-- Recommended categories (used in UI):
-- 'Politics', 'Technology', 'Economy', 'Science', 'Sports', 
-- 'Entertainment', 'Business', 'Weather', 'Geopolitics', 'Other'
