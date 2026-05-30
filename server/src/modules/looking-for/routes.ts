import { Router, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { authMiddleware, AuthenticatedRequest } from '../../middleware';

const router = Router();

// Get looking-for posts
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, city, status = 'active', page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = supabaseAdmin
      .from('looking_for_posts')
      .select('*, poster:profiles!poster_id(full_name, avatar_url)', { count: 'exact' })
      .eq('status', status as string)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1);

    if (type) query = query.eq('type', type as string);
    if (city) query = query.ilike('city', `%${city}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: parseInt(page as string) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create looking-for post
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, looking_role, city, ground_name, match_date, description } = req.body;
    const { data, error } = await supabaseAdmin
      .from('looking_for_posts')
      .insert({
        poster_id: req.userId!,
        type,
        looking_role,
        city,
        ground_name,
        match_date: match_date || null,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Close a post
router.patch('/:id/close', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('looking_for_posts')
      .update({ status: 'closed' })
      .eq('id', id)
      .eq('poster_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
