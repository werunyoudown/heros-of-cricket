export enum MatchStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum MatchType {
  T20 = 'T20',
  ODI = 'ODI',
  TEST = 'Test',
  CUSTOM = 'custom',
}

export enum TossDecision {
  BAT = 'bat',
  BOWL = 'bowl',
}

export enum InningsStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DECLARED = 'declared',
}

export enum WicketType {
  BOWLED = 'bowled',
  CAUGHT = 'caught',
  LBW = 'lbw',
  RUN_OUT = 'run_out',
  STUMPED = 'stumped',
  HIT_WICKET = 'hit_wicket',
  RETIRED = 'retired',
  RETIRED_HURT = 'retired_hurt',
  OBSTRUCTING = 'obstructing_the_field',
  TIMED_OUT = 'timed_out',
}

export enum ExtrasType {
  NONE = 'none',
  WIDE = 'wide',
  NO_BALL = 'no_ball',
  BYE = 'bye',
  LEG_BYE = 'leg_bye',
  PENALTY = 'penalty',
}

export enum PlayerRole {
  BATSMAN = 'batsman',
  BOWLER = 'bowler',
  ALL_ROUNDER = 'all_rounder',
  WICKET_KEEPER = 'wicket_keeper',
}

export enum BattingStyle {
  RIGHT_HAND = 'right_hand',
  LEFT_HAND = 'left_hand',
}

export enum BowlingStyle {
  RIGHT_ARM_FAST = 'right_arm_fast',
  RIGHT_ARM_MEDIUM = 'right_arm_medium',
  LEFT_ARM_FAST = 'left_arm_fast',
  LEFT_ARM_MEDIUM = 'left_arm_medium',
  RIGHT_ARM_OFF_SPIN = 'right_arm_off_spin',
  RIGHT_ARM_LEG_SPIN = 'right_arm_leg_spin',
  LEFT_ARM_ORTHODOX = 'left_arm_orthodox',
  LEFT_ARM_CHINAMAN = 'left_arm_chinaman',
}

export enum TeamMemberRole {
  CAPTAIN = 'captain',
  VICE_CAPTAIN = 'vice_captain',
  PLAYER = 'player',
}

export enum TeamMemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LEFT = 'left',
  INVITED = 'invited',
}

export enum TournamentFormat {
  LEAGUE = 'league',
  KNOCKOUT = 'knockout',
  GROUP_KNOCKOUT = 'group_knockout',
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  COMPLETED = 'completed',
}

export enum LookingForType {
  PLAYER = 'player',
  TEAM = 'team',
  OPPONENT = 'opponent',
  UMPIRE = 'umpire',
  GROUND = 'ground',
}

export enum NotificationType {
  MATCH_INVITE = 'match_invite',
  TEAM_INVITE = 'team_invite',
  SCORE_UPDATE = 'score_update',
  FOLLOW = 'follow',
  COMMENT = 'comment',
  LIKE = 'like',
  LOOKING_FOR_RESPONSE = 'looking_for_response',
  MATCH_COMPLETED = 'match_completed',
}
