import { Router, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../config';
import { AuthenticatedRequest, authMiddleware, validate } from '../../middleware';

const router = Router();

const createTournamentSchema = z.object({
  name: z.string().min(2).max(200),
  format: z.enum(['league', 'knockout', 'group_knockout']),
  teams_count: z.number().min(2).max(64),
  overs_per_match: z.number().min(1).max(90),
  city: z.string().optional(),
  state: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  entry_fee: z.number().optional(),
  prize_money: z.string().optional(),
  rules_text: z.string().optional(),
});

// POST /api/tournaments
router.post('/', authMiddleware, validate(createTournamentSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!profile) {
    res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .insert({ ...req.body, organizer_id: profile.id, status: 'upcoming' })
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.status(201).json(data);
});

// GET /api/tournaments
router.get('/', async (req, res: Response): Promise<void> => {
  const { status, city, page = '1', pageSize = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

  let query = supabaseAdmin
    .from('tournaments')
    .select('*', { count: 'exact' })
    .order('start_date', { ascending: false })
    .range(offset, offset + parseInt(pageSize as string) - 1);

  if (status) query = query.eq('status', status);
  if (city) query = query.ilike('city', `%${city}%`);

  const { data, error, count } = await query;

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json({
    data: data || [],
    count: count || 0,
    page: parseInt(page as string),
    pageSize: parseInt(pageSize as string),
    hasMore: (count || 0) > offset + parseInt(pageSize as string),
  });
});

// GET /api/tournaments/:id
router.get('/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .select(`
      *,
      organizer:profiles!tournaments_organizer_id_fkey(id, full_name, avatar_url),
      teams:tournament_teams(
        *,
        team:teams(id, name, short_name, logo_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Tournament not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  res.json(data);
});

// POST /api/tournaments/:id/teams — Register team
router.post('/:id/teams', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { team_id, group_name } = req.body;

  // Verify tournament exists
  const { data: tournament } = await supabaseAdmin
    .from('tournaments')
    .select('id, teams_count')
    .eq('id', id)
    .single();

  if (!tournament) {
    res.status(404).json({ message: 'Tournament not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  // Check capacity
  const { count } = await supabaseAdmin
    .from('tournament_teams')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id);

  if ((count || 0) >= tournament.teams_count) {
    res.status(400).json({ message: 'Tournament is full', code: 'BAD_REQUEST', status: 400 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('tournament_teams')
    .insert({
      tournament_id: id,
      team_id,
      group_name: group_name || null,
      points: 0,
      nrr: 0,
      matches_played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      no_result: 0,
    })
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.status(201).json(data);
});

// GET /api/tournaments/:id/standings
router.get('/:id/standings', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('tournament_teams')
    .select(`*, team:teams(id, name, short_name, logo_url)`)
    .eq('tournament_id', id)
    .order('points', { ascending: false })
    .order('nrr', { ascending: false });

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json(data || []);
});

// GET /api/tournaments/:id/fixtures
router.get('/:id/fixtures', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('tournament_fixtures')
    .select(`
      *,
      match:matches(
        *,
        team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
        team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url)
      )
    `)
    .eq('tournament_id', id)
    .order('fixture_number');

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json(data || []);
});

export default router;
