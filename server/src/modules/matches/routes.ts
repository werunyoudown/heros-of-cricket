import { Router, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../config';
import { AuthenticatedRequest, authMiddleware, validate } from '../../middleware';

const router = Router();

const createMatchSchema = z.object({
  match_type: z.enum(['T20', 'ODI', 'Test', 'custom']),
  overs_per_innings: z.number().min(1).max(90),
  team_a_id: z.string().uuid(),
  team_b_id: z.string().uuid(),
  venue: z.string().optional(),
  city: z.string().optional(),
  match_date: z.string(),
  tournament_id: z.string().uuid().optional(),
  toss_winner_id: z.string().uuid().optional(),
  toss_decision: z.enum(['bat', 'bowl']).optional(),
});

const recordBallSchema = z.object({
  batsman_id: z.string().uuid(),
  non_striker_id: z.string().uuid(),
  bowler_id: z.string().uuid(),
  runs_scored: z.number().min(0).max(7),
  extras_type: z.enum(['none', 'wide', 'no_ball', 'bye', 'leg_bye', 'penalty']).default('none'),
  extras_runs: z.number().min(0).default(0),
  is_wicket: z.boolean().default(false),
  wicket_type: z.enum(['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired', 'retired_hurt', 'obstructing_the_field', 'timed_out']).optional(),
  wicket_player_id: z.string().uuid().optional(),
  fielder_id: z.string().uuid().optional(),
  is_boundary: z.boolean().default(false),
});

// POST /api/matches — Create match
router.post('/', authMiddleware, validate(createMatchSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!profile) {
    res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  const { data: match, error } = await supabaseAdmin
    .from('matches')
    .insert({
      ...req.body,
      status: 'upcoming',
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.status(201).json(match);
});

// GET /api/matches — List matches
router.get('/', async (req, res: Response): Promise<void> => {
  const { status, city, page = '1', pageSize = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

  let query = supabaseAdmin
    .from('matches')
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url)
    `, { count: 'exact' })
    .order('match_date', { ascending: false })
    .range(offset, offset + parseInt(pageSize as string) - 1);

  if (status) {
    query = query.eq('status', status);
  }
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json({
    data,
    count: count || 0,
    page: parseInt(page as string),
    pageSize: parseInt(pageSize as string),
    hasMore: (count || 0) > offset + parseInt(pageSize as string),
  });
});

// GET /api/matches/:id — Match detail with scorecards
router.get('/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: match, error } = await supabaseAdmin
    .from('matches')
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url),
      innings(*)
    `)
    .eq('id', id)
    .single();

  if (error || !match) {
    res.status(404).json({ message: 'Match not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  res.json(match);
});

// POST /api/matches/:id/start — Start scoring (set to live)
router.post('/:id/start', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { batting_team_id, bowling_team_id } = req.body;

  // Update match status to live
  const { error: matchError } = await supabaseAdmin
    .from('matches')
    .update({ status: 'live', scoring_started_at: new Date().toISOString() })
    .eq('id', id);

  if (matchError) {
    res.status(400).json({ message: matchError.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  // Create first innings
  const { data: innings, error } = await supabaseAdmin
    .from('innings')
    .insert({
      match_id: id,
      batting_team_id,
      bowling_team_id,
      innings_number: 1,
      total_runs: 0,
      total_wickets: 0,
      total_overs: 0,
      extras_wides: 0,
      extras_no_balls: 0,
      extras_byes: 0,
      extras_leg_byes: 0,
      extras_penalty: 0,
      is_completed: false,
      declared: false,
    })
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json({ match_id: id, innings });
});

// POST /api/matches/:id/ball — Record a ball (THE CORE SCORING ENDPOINT)
router.post('/:id/ball', authMiddleware, validate(recordBallSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const ballData = req.body;

  // Get current innings
  const { data: innings } = await supabaseAdmin
    .from('innings')
    .select('*')
    .eq('match_id', id)
    .eq('is_completed', false)
    .order('innings_number', { ascending: false })
    .limit(1)
    .single();

  if (!innings) {
    res.status(400).json({ message: 'No active innings', code: 'BAD_REQUEST', status: 400 });
    return;
  }

  // Get last ball to determine sequence
  const { data: lastBall } = await supabaseAdmin
    .from('ball_by_ball')
    .select('ball_sequence, over_number, ball_number')
    .eq('innings_id', innings.id)
    .order('ball_sequence', { ascending: false })
    .limit(1)
    .single();

  const ballSequence = (lastBall?.ball_sequence || 0) + 1;

  // Determine over and ball number
  // Wides and no-balls don't count as legal deliveries
  const isLegalDelivery = ballData.extras_type !== 'wide' && ballData.extras_type !== 'no_ball';
  
  let overNumber = lastBall?.over_number || 0;
  let ballNumber = lastBall?.ball_number || 0;

  if (isLegalDelivery) {
    ballNumber += 1;
    if (ballNumber > 6) {
      overNumber += 1;
      ballNumber = 1;
    }
  }

  // If it's the first ball
  if (!lastBall && isLegalDelivery) {
    overNumber = 0;
    ballNumber = 1;
  }

  // Insert ball
  const { data: ball, error: ballError } = await supabaseAdmin
    .from('ball_by_ball')
    .insert({
      innings_id: innings.id,
      over_number: overNumber,
      ball_number: ballNumber,
      ball_sequence: ballSequence,
      batsman_id: ballData.batsman_id,
      non_striker_id: ballData.non_striker_id,
      bowler_id: ballData.bowler_id,
      runs_scored: ballData.runs_scored,
      is_boundary: ballData.is_boundary || (ballData.runs_scored === 4 || ballData.runs_scored === 6),
      extras_type: ballData.extras_type,
      extras_runs: ballData.extras_runs,
      is_wicket: ballData.is_wicket,
      wicket_type: ballData.wicket_type || null,
      wicket_player_id: ballData.wicket_player_id || null,
      fielder_id: ballData.fielder_id || null,
      is_free_hit: false,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (ballError) {
    res.status(400).json({ message: ballError.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  // Update innings totals
  const totalRuns = innings.total_runs + ballData.runs_scored + ballData.extras_runs;
  const totalWickets = innings.total_wickets + (ballData.is_wicket ? 1 : 0);
  const totalOvers = isLegalDelivery ? overNumber + (ballNumber / 10) : innings.total_overs;

  const extrasUpdate: Record<string, number> = {};
  if (ballData.extras_type === 'wide') extrasUpdate.extras_wides = innings.extras_wides + ballData.extras_runs;
  if (ballData.extras_type === 'no_ball') extrasUpdate.extras_no_balls = innings.extras_no_balls + ballData.extras_runs;
  if (ballData.extras_type === 'bye') extrasUpdate.extras_byes = innings.extras_byes + ballData.extras_runs;
  if (ballData.extras_type === 'leg_bye') extrasUpdate.extras_leg_byes = innings.extras_leg_byes + ballData.extras_runs;

  await supabaseAdmin
    .from('innings')
    .update({
      total_runs: totalRuns,
      total_wickets: totalWickets,
      total_overs: totalOvers,
      ...extrasUpdate,
    })
    .eq('id', innings.id);

  // Check if innings is over (all out or overs complete)
  const { data: matchData } = await supabaseAdmin
    .from('matches')
    .select('overs_per_innings')
    .eq('id', id)
    .single();

  const isAllOut = totalWickets >= 10;
  const isOversComplete = isLegalDelivery && ballNumber === 6 && overNumber === (matchData?.overs_per_innings || 20) - 1;

  let inningsCompleted = false;
  if (isAllOut || isOversComplete) {
    await supabaseAdmin
      .from('innings')
      .update({ is_completed: true })
      .eq('id', innings.id);
    inningsCompleted = true;
  }

  res.json({
    ball,
    innings_summary: {
      total_runs: totalRuns,
      total_wickets: totalWickets,
      total_overs: totalOvers,
      innings_completed: inningsCompleted,
    },
  });
});

// DELETE /api/matches/:id/ball/last — Undo last ball
router.delete('/:id/ball/last', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Get current innings
  const { data: innings } = await supabaseAdmin
    .from('innings')
    .select('*')
    .eq('match_id', id)
    .order('innings_number', { ascending: false })
    .limit(1)
    .single();

  if (!innings) {
    res.status(400).json({ message: 'No innings found', code: 'BAD_REQUEST', status: 400 });
    return;
  }

  // Get last ball
  const { data: lastBall } = await supabaseAdmin
    .from('ball_by_ball')
    .select('*')
    .eq('innings_id', innings.id)
    .order('ball_sequence', { ascending: false })
    .limit(1)
    .single();

  if (!lastBall) {
    res.status(400).json({ message: 'No balls to undo', code: 'BAD_REQUEST', status: 400 });
    return;
  }

  // Delete the ball
  await supabaseAdmin.from('ball_by_ball').delete().eq('id', lastBall.id);

  // Recalculate innings totals
  const totalRuns = innings.total_runs - lastBall.runs_scored - lastBall.extras_runs;
  const totalWickets = innings.total_wickets - (lastBall.is_wicket ? 1 : 0);

  await supabaseAdmin
    .from('innings')
    .update({
      total_runs: Math.max(0, totalRuns),
      total_wickets: Math.max(0, totalWickets),
      is_completed: false,
    })
    .eq('id', innings.id);

  res.json({ message: 'Last ball undone', removed_ball: lastBall });
});

// POST /api/matches/:id/innings/end — End innings manually
router.post('/:id/innings/end', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { declared = false } = req.body;

  // Mark current innings complete
  const { data: currentInnings } = await supabaseAdmin
    .from('innings')
    .select('*')
    .eq('match_id', id)
    .eq('is_completed', false)
    .single();

  if (!currentInnings) {
    res.status(400).json({ message: 'No active innings to end', code: 'BAD_REQUEST', status: 400 });
    return;
  }

  await supabaseAdmin
    .from('innings')
    .update({ is_completed: true, declared })
    .eq('id', currentInnings.id);

  // Create next innings
  const nextInningsNumber = currentInnings.innings_number + 1;

  const { data: newInnings, error } = await supabaseAdmin
    .from('innings')
    .insert({
      match_id: id,
      batting_team_id: currentInnings.bowling_team_id,
      bowling_team_id: currentInnings.batting_team_id,
      innings_number: nextInningsNumber,
      total_runs: 0,
      total_wickets: 0,
      total_overs: 0,
      extras_wides: 0,
      extras_no_balls: 0,
      extras_byes: 0,
      extras_leg_byes: 0,
      extras_penalty: 0,
      is_completed: false,
      declared: false,
    })
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json({ previous_innings: currentInnings, new_innings: newInnings });
});

// POST /api/matches/:id/complete — Complete match
router.post('/:id/complete', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Get all innings
  const { data: allInnings } = await supabaseAdmin
    .from('innings')
    .select('*')
    .eq('match_id', id)
    .order('innings_number');

  if (!allInnings || allInnings.length < 2) {
    res.status(400).json({ message: 'Match needs at least 2 innings to complete', code: 'BAD_REQUEST', status: 400 });
    return;
  }

  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('team_a_id, team_b_id')
    .eq('id', id)
    .single();

  if (!match) {
    res.status(404).json({ message: 'Match not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  // Simple result calculation for limited-overs
  const firstInnings = allInnings[0];
  const secondInnings = allInnings[1];

  let winnerId: string | null = null;
  let resultSummary = '';

  if (secondInnings.total_runs > firstInnings.total_runs) {
    winnerId = secondInnings.batting_team_id;
    const wicketsLeft = 10 - secondInnings.total_wickets;
    resultSummary = `Won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}`;
  } else if (firstInnings.total_runs > secondInnings.total_runs) {
    winnerId = firstInnings.batting_team_id;
    const runDiff = firstInnings.total_runs - secondInnings.total_runs;
    resultSummary = `Won by ${runDiff} run${runDiff > 1 ? 's' : ''}`;
  } else {
    resultSummary = 'Match Tied';
  }

  await supabaseAdmin
    .from('matches')
    .update({
      status: 'completed',
      winner_id: winnerId,
      result_summary: resultSummary,
      scoring_ended_at: new Date().toISOString(),
    })
    .eq('id', id);

  // Mark any incomplete innings as complete
  await supabaseAdmin
    .from('innings')
    .update({ is_completed: true })
    .eq('match_id', id)
    .eq('is_completed', false);

  res.json({ winner_id: winnerId, result_summary: resultSummary });
});

// GET /api/matches/:id/scorecard — Full scorecard
router.get('/:id/scorecard', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: batting } = await supabaseAdmin
    .from('batting_scorecard')
    .select(`*, player:profiles(id, full_name, avatar_url)`)
    .eq('match_id', id)
    .order('batting_position');

  const { data: bowling } = await supabaseAdmin
    .from('bowling_scorecard')
    .select(`*, player:profiles(id, full_name, avatar_url)`)
    .eq('match_id', id);

  res.json({ batting: batting || [], bowling: bowling || [] });
});

// GET /api/matches/:id/ball-by-ball
router.get('/:id/ball-by-ball', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  const { innings_number } = req.query;

  let query = supabaseAdmin
    .from('ball_by_ball')
    .select(`
      *,
      batsman:profiles!ball_by_ball_batsman_id_fkey(id, full_name),
      bowler:profiles!ball_by_ball_bowler_id_fkey(id, full_name)
    `)
    .order('ball_sequence', { ascending: true });

  // Get innings for this match first
  const { data: innings } = await supabaseAdmin
    .from('innings')
    .select('id')
    .eq('match_id', id);

  if (!innings || innings.length === 0) {
    res.json([]);
    return;
  }

  const inningsIds = innings.map((i) => i.id);
  query = query.in('innings_id', inningsIds);

  if (innings_number) {
    const targetInnings = innings[parseInt(innings_number as string) - 1];
    if (targetInnings) {
      query = query.eq('innings_id', targetInnings.id);
    }
  }

  const { data, error } = await query;

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json(data || []);
});

export default router;
