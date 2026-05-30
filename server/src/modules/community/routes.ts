import { Router, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { authMiddleware, AuthenticatedRequest } from '../../middleware';

const router = Router();

// Get all posts
router.get('/posts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { data, error, count } = await supabaseAdmin
      .from('posts')
      .select('*, author:profiles!author_id(full_name, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1);

    if (error) throw error;
    res.json({ data, total: count, page: parseInt(page as string) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
router.post('/posts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, media_urls, match_id } = req.body;
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({ author_id: req.userId!, content, media_urls: media_urls || [], match_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Like a post
router.post('/posts/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('post_likes')
      .insert({ post_id: id, user_id: req.userId! });

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Already liked' });
      throw error;
    }

    // Increment likes count (best-effort)
    const rpcResult = await supabaseAdmin.rpc('increment_likes', { post_id_input: id });
    if (rpcResult.error) {
      // rpc doesn't exist yet, ignore
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unlike a post
router.delete('/posts/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('post_likes')
      .delete()
      .eq('post_id', id)
      .eq('user_id', req.userId!);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get comments for a post
router.get('/posts/:id/comments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select('*, author:profiles!author_id(full_name, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/posts/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({ post_id: id, author_id: req.userId!, content })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
