-- CricHeroes Database Schema
-- Migration: Initial Schema

-- Enable UUID extension

-- ─── PROFILES ─────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  batting_style TEXT CHECK (batting_style IN ('right_hand', 'left_hand')),
  bowling_style TEXT CHECK (bowling_style IN (
    'right_arm_fast', 'right_arm_medium', 'left_arm_fast', 'left_arm_medium',
    'right_arm_off_spin', 'right_arm_leg_spin', 'left_arm_orthodox', 'left_arm_chinaman'
  )),
  role TEXT CHECK (role IN ('batsman', 'bowler', 'all_rounder', 'wicket_keeper')),
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  bio TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TEAMS ────────────────────────────────────────────────────────

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  banner_url TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  captain_id UUID NOT NULL REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('captain', 'vice_captain', 'player')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'left', 'invited')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id, status)
);

-- ─── TOURNAMENTS ──────────────────────────────────────────────────

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  organizer_id UUID NOT NULL REFERENCES profiles(id),
  format TEXT NOT NULL CHECK (format IN ('league', 'knockout', 'group_knockout')),
  teams_count INTEGER NOT NULL DEFAULT 8,
  overs_per_match INTEGER NOT NULL DEFAULT 20,
  city TEXT,
  state TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  entry_fee NUMERIC,
  prize_money TEXT,
  rules_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  group_name TEXT,
  points INTEGER DEFAULT 0,
  nrr NUMERIC(6,3) DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  no_result INTEGER DEFAULT 0,
  UNIQUE(tournament_id, team_id)
);

-- ─── MATCHES ──────────────────────────────────────────────────────

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  match_type TEXT NOT NULL CHECK (match_type IN ('T20', 'ODI', 'Test', 'custom')),
  overs_per_innings INTEGER NOT NULL DEFAULT 20,
  team_a_id UUID NOT NULL REFERENCES teams(id),
  team_b_id UUID NOT NULL REFERENCES teams(id),
  toss_winner_id UUID REFERENCES teams(id),
  toss_decision TEXT CHECK (toss_decision IN ('bat', 'bowl')),
  venue TEXT,
  city TEXT,
  match_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'abandoned')),
  result_summary TEXT,
  winner_id UUID REFERENCES teams(id),
  man_of_match_id UUID REFERENCES profiles(id),
  tournament_id UUID REFERENCES tournaments(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  scoring_started_at TIMESTAMPTZ,
  scoring_ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id),
  round TEXT NOT NULL DEFAULT 'group',
  fixture_number INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ
);

-- ─── INNINGS ──────────────────────────────────────────────────────

CREATE TABLE innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  batting_team_id UUID NOT NULL REFERENCES teams(id),
  bowling_team_id UUID NOT NULL REFERENCES teams(id),
  innings_number INTEGER NOT NULL CHECK (innings_number BETWEEN 1 AND 4),
  total_runs INTEGER DEFAULT 0,
  total_wickets INTEGER DEFAULT 0 CHECK (total_wickets <= 10),
  total_overs NUMERIC(5,1) DEFAULT 0,
  extras_wides INTEGER DEFAULT 0,
  extras_no_balls INTEGER DEFAULT 0,
  extras_byes INTEGER DEFAULT 0,
  extras_leg_byes INTEGER DEFAULT 0,
  extras_penalty INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  declared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BALL BY BALL ─────────────────────────────────────────────────

CREATE TABLE ball_by_ball (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
  over_number INTEGER NOT NULL DEFAULT 0,
  ball_number INTEGER NOT NULL DEFAULT 0,
  ball_sequence INTEGER NOT NULL,
  batsman_id UUID NOT NULL REFERENCES profiles(id),
  non_striker_id UUID NOT NULL REFERENCES profiles(id),
  bowler_id UUID NOT NULL REFERENCES profiles(id),
  runs_scored INTEGER NOT NULL DEFAULT 0,
  is_boundary BOOLEAN DEFAULT FALSE,
  extras_type TEXT NOT NULL DEFAULT 'none' CHECK (extras_type IN ('none', 'wide', 'no_ball', 'bye', 'leg_bye', 'penalty')),
  extras_runs INTEGER DEFAULT 0,
  is_wicket BOOLEAN DEFAULT FALSE,
  wicket_type TEXT CHECK (wicket_type IN (
    'bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket',
    'retired', 'retired_hurt', 'obstructing_the_field', 'timed_out'
  )),
  wicket_player_id UUID REFERENCES profiles(id),
  fielder_id UUID REFERENCES profiles(id),
  is_free_hit BOOLEAN DEFAULT FALSE,
  commentary_text TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SCORECARDS ───────────────────────────────────────────────────

CREATE TABLE batting_scorecard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  runs INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  strike_rate NUMERIC(6,2) DEFAULT 0,
  how_out TEXT,
  bowler_id UUID REFERENCES profiles(id),
  fielder_id UUID REFERENCES profiles(id),
  batting_position INTEGER NOT NULL,
  is_not_out BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bowling_scorecard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES innings(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  overs_bowled NUMERIC(4,1) DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  economy NUMERIC(5,2) DEFAULT 0,
  wides INTEGER DEFAULT 0,
  no_balls INTEGER DEFAULT 0,
  dot_balls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PLAYER STATS ─────────────────────────────────────────────────

CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE NOT NULL REFERENCES profiles(id),
  matches_played INTEGER DEFAULT 0,
  innings_batted INTEGER DEFAULT 0,
  innings_bowled INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,
  batting_average NUMERIC(6,2) DEFAULT 0,
  strike_rate NUMERIC(6,2) DEFAULT 0,
  hundreds INTEGER DEFAULT 0,
  fifties INTEGER DEFAULT 0,
  total_wickets INTEGER DEFAULT 0,
  best_bowling TEXT,
  bowling_average NUMERIC(6,2) DEFAULT 0,
  bowling_economy NUMERIC(5,2) DEFAULT 0,
  bowling_strike_rate NUMERIC(6,2) DEFAULT 0,
  catches INTEGER DEFAULT 0,
  stumpings INTEGER DEFAULT 0,
  run_outs INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMMUNITY ────────────────────────────────────────────────────

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  match_id UUID REFERENCES matches(id),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id),
  following_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ─── LOOKING FOR ──────────────────────────────────────────────────

CREATE TABLE looking_for_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('player', 'team', 'opponent', 'umpire', 'ground')),
  looking_role TEXT CHECK (looking_role IN ('batsman', 'bowler', 'all_rounder', 'wicket_keeper')),
  city TEXT,
  ground_name TEXT,
  match_date DATE,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data_json JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_date ON matches(match_date DESC);
CREATE INDEX idx_ball_by_ball_innings ON ball_by_ball(innings_id, ball_sequence);
CREATE INDEX idx_innings_match ON innings(match_id, innings_number);
CREATE INDEX idx_team_members_team ON team_members(team_id, status);
CREATE INDEX idx_team_members_player ON team_members(player_id);
CREATE INDEX idx_player_stats_runs ON player_stats(total_runs DESC);
CREATE INDEX idx_player_stats_wickets ON player_stats(total_wickets DESC);
CREATE INDEX idx_looking_for_type_city ON looking_for_posts(type, city, status);
CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_teams_tournament ON tournament_teams(tournament_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ball_by_ball ENABLE ROW LEVEL SECURITY;
ALTER TABLE batting_scorecard ENABLE ROW LEVEL SECURITY;
ALTER TABLE bowling_scorecard ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE looking_for_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read for most tables
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated create teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Captain update teams" ON teams FOR UPDATE USING (
  captain_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Public read team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Captain manage members" ON team_members FOR ALL USING (
  team_id IN (SELECT id FROM teams WHERE captain_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Authenticated create matches" ON matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creator update matches" ON matches FOR UPDATE USING (
  created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Public read innings" ON innings FOR SELECT USING (true);
CREATE POLICY "Public read ball_by_ball" ON ball_by_ball FOR SELECT USING (true);
CREATE POLICY "Public read batting_scorecard" ON batting_scorecard FOR SELECT USING (true);
CREATE POLICY "Public read bowling_scorecard" ON bowling_scorecard FOR SELECT USING (true);

CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Organizer update tournaments" ON tournaments FOR UPDATE USING (
  organizer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Public read tournament_teams" ON tournament_teams FOR SELECT USING (true);
CREATE POLICY "Public read tournament_fixtures" ON tournament_fixtures FOR SELECT USING (true);
CREATE POLICY "Public read player_stats" ON player_stats FOR SELECT USING (true);

CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Author update posts" ON posts FOR UPDATE USING (
  author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Author delete posts" ON posts FOR DELETE USING (
  author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read post_likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated manage likes" ON post_likes FOR ALL USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated manage follows" ON follows FOR ALL USING (
  follower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Public read looking_for" ON looking_for_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated create looking_for" ON looking_for_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Poster manage looking_for" ON looking_for_posts FOR UPDATE USING (
  poster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "User read own notifications" ON notifications FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "User update own notifications" ON notifications FOR UPDATE USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- ─── REALTIME ─────────────────────────────────────────────────────

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE ball_by_ball;
ALTER PUBLICATION supabase_realtime ADD TABLE innings;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- ─── FUNCTIONS / TRIGGERS ─────────────────────────────────────────

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Player'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
