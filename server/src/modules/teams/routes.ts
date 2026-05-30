import { Router, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../config';
import { AuthenticatedRequest, authMiddleware, validate } from '../../middleware';

const router = Router();

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  short_name: z.string().max(10).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

const addMemberSchema = z.object({
  player_id: z.string().uuid(),
  role: z.enum(['captain', 'vice_captain', 'player']).default('player'),
});

// POST /api/teams — Create team
router.post('/', authMiddleware, validate(createTeamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, short_name, city, state, country } = req.body;

  // Get user profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!profile) {
    res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .insert({
      name,
      short_name: short_name || null,
      city: city || null,
      state: state || null,
      country: country || null,
      captain_id: profile.id,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  // Add creator as captain member
  await supabaseAdmin.from('team_members').insert({
    team_id: team.id,
    player_id: profile.id,
    role: 'captain',
    status: 'active',
  });

  res.status(201).json(team);
});

// GET /api/teams/:id
router.get('/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .select(`
      *,
      captain:profiles!teams_captain_id_fkey(id, full_name, avatar_url),
      members:team_members(
        id, role, status, joined_at,
        player:profiles(id, full_name, avatar_url, role, batting_style, bowling_style)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !team) {
    res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  res.json(team);
});

// GET /api/teams — List teams with optional search
router.get('/', async (req, res: Response): Promise<void> => {
  const { q, city, page = '1', pageSize = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

  let query = supabaseAdmin
    .from('teams')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(pageSize as string) - 1);

  if (q) {
    query = query.ilike('name', `%${q}%`);
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

// PUT /api/teams/:id
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  // Check if user is captain
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('captain_id')
    .eq('id', id)
    .single();

  if (!team || team.captain_id !== profile?.id) {
    res.status(403).json({ message: 'Only the captain can update the team', code: 'FORBIDDEN', status: 403 });
    return;
  }

  const { name, short_name, city, state, country } = req.body;

  const { data, error } = await supabaseAdmin
    .from('teams')
    .update({ name, short_name, city, state, country })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json(data);
});

// POST /api/teams/:id/members — Add member
router.post('/:id/members', authMiddleware, validate(addMemberSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { player_id, role } = req.body;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  // Check captain
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('captain_id')
    .eq('id', id)
    .single();

  if (!team || team.captain_id !== profile?.id) {
    res.status(403).json({ message: 'Only the captain can add members', code: 'FORBIDDEN', status: 403 });
    return;
  }

  // Check if already a member
  const { data: existing } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('team_id', id)
    .eq('player_id', player_id)
    .eq('status', 'active')
    .single();

  if (existing) {
    res.status(409).json({ message: 'Player is already a member', code: 'CONFLICT', status: 409 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('team_members')
    .insert({
      team_id: id,
      player_id,
      role,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.status(201).json(data);
});

// DELETE /api/teams/:id/members/:playerId
router.delete('/:id/members/:playerId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, playerId } = req.params;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('captain_id')
    .eq('id', id)
    .single();

  if (!team || team.captain_id !== profile?.id) {
    res.status(403).json({ message: 'Only the captain can remove members', code: 'FORBIDDEN', status: 403 });
    return;
  }

  const { error } = await supabaseAdmin
    .from('team_members')
    .update({ status: 'left' })
    .eq('team_id', id)
    .eq('player_id', playerId);

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json({ message: 'Member removed' });
});

export default router;
