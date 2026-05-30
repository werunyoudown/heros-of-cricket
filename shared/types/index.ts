import {
  MatchStatus,
  MatchType,
  TossDecision,
  WicketType,
  ExtrasType,
  PlayerRole,
  BattingStyle,
  BowlingStyle,
  TeamMemberRole,
  TeamMemberStatus,
  TournamentFormat,
  TournamentStatus,
  LookingForType,
  NotificationType,
} from '../enums';

// ─── User & Profile ───────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  batting_style: BattingStyle | null;
  bowling_style: BowlingStyle | null;
  role: PlayerRole | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bio: string | null;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Teams ────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  captain_id: string;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  joined_at: string;
}

// ─── Matches ──────────────────────────────────────────────────────

export interface Match {
  id: string;
  title: string | null;
  match_type: MatchType;
  overs_per_innings: number;
  team_a_id: string;
  team_b_id: string;
  toss_winner_id: string | null;
  toss_decision: TossDecision | null;
  venue: string | null;
  city: string | null;
  match_date: string;
  status: MatchStatus;
  result_summary: string | null;
  winner_id: string | null;
  man_of_match_id: string | null;
  tournament_id: string | null;
  created_by: string;
  scoring_started_at: string | null;
  scoring_ended_at: string | null;
  created_at: string;
}

export interface Innings {
  id: string;
  match_id: string;
  batting_team_id: string;
  bowling_team_id: string;
  innings_number: number;
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  extras_wides: number;
  extras_no_balls: number;
  extras_byes: number;
  extras_leg_byes: number;
  extras_penalty: number;
  is_completed: boolean;
  declared: boolean;
  created_at: string;
}

export interface BallByBall {
  id: string;
  innings_id: string;
  over_number: number;
  ball_number: number;
  ball_sequence: number;
  batsman_id: string;
  non_striker_id: string;
  bowler_id: string;
  runs_scored: number;
  is_boundary: boolean;
  extras_type: ExtrasType;
  extras_runs: number;
  is_wicket: boolean;
  wicket_type: WicketType | null;
  wicket_player_id: string | null;
  fielder_id: string | null;
  is_free_hit: boolean;
  commentary_text: string | null;
  timestamp: string;
  created_at: string;
}

export interface BattingScorecard {
  id: string;
  innings_id: string;
  match_id: string;
  player_id: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  how_out: string | null;
  bowler_id: string | null;
  fielder_id: string | null;
  batting_position: number;
  is_not_out: boolean;
  created_at: string;
}

export interface BowlingScorecard {
  id: string;
  innings_id: string;
  match_id: string;
  player_id: string;
  overs_bowled: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  economy: number;
  wides: number;
  no_balls: number;
  dot_balls: number;
  created_at: string;
}

// ─── Tournaments ──────────────────────────────────────────────────

export interface Tournament {
  id: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  organizer_id: string;
  format: TournamentFormat;
  teams_count: number;
  overs_per_match: number;
  city: string | null;
  state: string | null;
  start_date: string;
  end_date: string | null;
  status: TournamentStatus;
  entry_fee: number | null;
  prize_money: string | null;
  rules_text: string | null;
  created_at: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  team_id: string;
  group_name: string | null;
  points: number;
  nrr: number;
  matches_played: number;
  won: number;
  lost: number;
  drawn: number;
  no_result: number;
}

export interface TournamentFixture {
  id: string;
  tournament_id: string;
  match_id: string;
  round: string;
  fixture_number: number;
  scheduled_at: string;
}

// ─── Player Stats ─────────────────────────────────────────────────

export interface PlayerStats {
  id: string;
  player_id: string;
  matches_played: number;
  innings_batted: number;
  innings_bowled: number;
  total_runs: number;
  highest_score: number;
  batting_average: number;
  strike_rate: number;
  hundreds: number;
  fifties: number;
  total_wickets: number;
  best_bowling: string | null;
  bowling_average: number;
  bowling_economy: number;
  bowling_strike_rate: number;
  catches: number;
  stumpings: number;
  run_outs: number;
  last_updated: string;
}

// ─── Community ────────────────────────────────────────────────────

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  match_id: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// ─── Looking For ──────────────────────────────────────────────────

export interface LookingForPost {
  id: string;
  poster_id: string;
  type: LookingForType;
  looking_role: PlayerRole | null;
  city: string | null;
  ground_name: string | null;
  match_date: string | null;
  description: string;
  status: 'active' | 'closed';
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data_json: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// ─── API Request/Response Types ───────────────────────────────────

export interface RecordBallRequest {
  batsman_id: string;
  non_striker_id: string;
  bowler_id: string;
  runs_scored: number;
  extras_type: ExtrasType;
  extras_runs: number;
  is_wicket: boolean;
  wicket_type?: WicketType;
  wicket_player_id?: string;
  fielder_id?: string;
  is_boundary?: boolean;
}

export interface CreateMatchRequest {
  match_type: MatchType;
  overs_per_innings: number;
  team_a_id: string;
  team_b_id: string;
  venue?: string;
  city?: string;
  match_date: string;
  tournament_id?: string;
  toss_winner_id?: string;
  toss_decision?: TossDecision;
}

export interface CreateTeamRequest {
  name: string;
  short_name?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CreateTournamentRequest {
  name: string;
  format: TournamentFormat;
  teams_count: number;
  overs_per_match: number;
  city?: string;
  state?: string;
  start_date: string;
  end_date?: string;
  entry_fee?: number;
  prize_money?: string;
  rules_text?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}
