import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware';
import authRoutes from './modules/auth/routes';
import teamRoutes from './modules/teams/routes';
import matchRoutes from './modules/matches/routes';
import playerRoutes from './modules/players/routes';
import tournamentRoutes from './modules/tournaments/routes';
import communityRoutes from './modules/community/routes';
import lookingForRoutes from './modules/looking-for/routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/looking-for', lookingForRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🏏 CricHeroes server running on port ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
});

export default app;
