import { Router, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../config';
import { AuthenticatedRequest, authMiddleware, validate } from '../../middleware';

const router = Router();

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2).max(100),
  phone: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/signup
router.post('/signup', validate(signUpSchema), async (req, res: Response): Promise<void> => {
  const { email, password, full_name, phone } = req.body;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone },
  });

  if (error) {
    console.error('User creation failed:', error.message);
    res.status(400).json({ message: error.message, code: 'AUTH_ERROR', status: 400 });
    return;
  }

  // Update profile with phone if provided (trigger creates profile with just full_name)
  if (phone) {
    await supabaseAdmin
      .from('profiles')
      .update({ phone })
      .eq('user_id', data.user.id);
  }

  // Sign in to get tokens
  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    res.status(400).json({ message: signInError.message, code: 'AUTH_ERROR', status: 400 });
    return;
  }

  res.status(201).json({
    user: data.user,
    session: session.session,
  });
});

// POST /api/auth/signin
router.post('/signin', validate(signInSchema), async (req, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ message: error.message, code: 'AUTH_ERROR', status: 401 });
    return;
  }

  res.json({
    user: data.user,
    session: data.session,
  });
});

// POST /api/auth/signout
router.post('/signout', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader!.split(' ')[1];

  // Revoke the session by signing out
  await supabaseAdmin.auth.admin.signOut(token);

  res.json({ message: 'Signed out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND', status: 404 });
    return;
  }

  res.json(data);
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res: Response): Promise<void> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    res.status(400).json({ message: 'Refresh token required', code: 'VALIDATION_ERROR', status: 400 });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });

  if (error) {
    res.status(401).json({ message: error.message, code: 'AUTH_ERROR', status: 401 });
    return;
  }

  res.json({ session: data.session });
});

export default router;
