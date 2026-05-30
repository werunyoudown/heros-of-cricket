import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED', status: 401 });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED', status: 401 });
      return;
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    next();
  } catch {
    res.status(401).json({ message: 'Authentication failed', code: 'UNAUTHORIZED', status: 401 });
  }
}
