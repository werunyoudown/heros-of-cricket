import { Router, Response } from 'express';
import { supabaseAdmin } from '../../config';
import { AuthenticatedRequest, authMiddleware } from '../../middleware';

const router = Router();

// GET /api/players/:id — Player profile
router.get('/:id', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !profile) {
    res.status(404).json({ message: 'Player not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  // Get follower/following counts
  const { count: followersCount } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', id);

  const { count: followingCount } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', id);

  res.json({
    ...profile,
    followers_count: followersCount || 0,
    following_count: followingCount || 0,
  });
});

// PUT /api/players/:id — Update profile
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Verify the user owns this profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!profile || profile.user_id !== req.userId) {
    res.status(403).json({ message: 'Cannot update another user profile', code: 'FORBIDDEN', status: 403 });
    return;
  }

  const { full_name, display_name, batting_style, bowling_style, role, city, state, country, bio } = req.body;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name,
      display_name,
      batting_style,
      bowling_style,
      role,
      city,
      state,
      country,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.json(data);
});

// GET /api/players/:id/stats
router.get('/:id/stats', async (req, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('player_stats')
    .select('*')
    .eq('player_id', id)
    .single();

  if (error || !data) {
    // Return empty stats if not yet computed
    res.json({
      player_id: id,
      matches_played: 0,
      innings_batted: 0,
      innings_bowled: 0,
      total_runs: 0,
      highest_score: 0,
      batting_average: 0,
      strike_rate: 0,
      hundreds: 0,
      fifties: 0,
      total_wickets: 0,
      best_bowling: null,
      bowling_average: 0,
      bowling_economy: 0,
      bowling_strike_rate: 0,
      catches: 0,
      stumpings: 0,
      run_outs: 0,
    });
    return;
  }

  res.json(data);
});

// GET /api/players/:id/matches — Match history
router.get('/:id/matches', async (req, res: Response): Promise<void> => {
  const { id } = req.params;
  const { page = '1', pageSize = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

  // Get teams the player is part of
  const { data: memberships } = await supabaseAdmin
    .from('team_members')
    .select('team_id')
    .eq('player_id', id);

  if (!memberships || memberships.length === 0) {
    res.json({ data: [], count: 0, page: 1, pageSize: 20, hasMore: false });
    return;
  }

  const teamIds = memberships.map((m) => m.team_id);

  const { data, error, count } = await supabaseAdmin
    .from('matches')
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, short_name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, short_name, logo_url)
    `, { count: 'exact' })
    .or(`team_a_id.in.(${teamIds.join(',')}),team_b_id.in.(${teamIds.join(',')})`)
    .order('match_date', { ascending: false })
    .range(offset, offset + parseInt(pageSize as string) - 1);

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

// GET /api/players/search?q=
router.get('/', async (req, res: Response): Promise<void> => {
  const { q, city, role, page = '1', pageSize = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, display_name, avatar_url, role, city, batting_style, bowling_style', { count: 'exact' })
    .order('full_name')
    .range(offset, offset + parseInt(pageSize as string) - 1);

  if (q) {
    query = query.ilike('full_name', `%${q}%`);
  }
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }

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

// POST /api/players/:id/follow
router.post('/:id/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: followingId } = req.params;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!profile) {
    res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  if (profile.id === followingId) {
    res.status(400).json({ message: 'Cannot follow yourself', code: 'BAD_REQUEST', status: 400 });
    return;
  }

  const { error } = await supabaseAdmin
    .from('follows')
    .insert({ follower_id: profile.id, following_id: followingId });

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'Already following', code: 'CONFLICT', status: 409 });
      return;
    }
    res.status(400).json({ message: error.message, code: 'DB_ERROR', status: 400 });
    return;
  }

  res.status(201).json({ message: 'Followed successfully' });
});

// DELETE /api/players/:id/follow
router.delete('/:id/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: followingId } = req.params;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!profile) {
    res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  await supabaseAdmin
    .from('follows')
    .delete()
    .eq('follower_id', profile.id)
    .eq('following_id', followingId);

  res.json({ message: 'Unfollowed successfully' });
});

export default router;
