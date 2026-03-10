import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import { authRouter } from './routes/auth';
import { calendarRouter } from './routes/calendar';
import { teamRouter } from './routes/teams';
import { eventRouter } from './routes/events';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'http://localhost:3000']
    : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// API Routes
app.use('/auth', authRouter);
app.use('/api/calendars', calendarRouter);
app.use('/api/teams', teamRouter);
app.use('/api/events', eventRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
const HOST = process.env.HOST || '0.0.0.0';
const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
app.listen(Number(PORT), HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔷 TeamCal Server Running                               ║
║                                                           ║
║   Local:    http://${displayHost}:${PORT}                        ║
║   API:      http://${displayHost}:${PORT}/api                   ║
║   Auth:     http://${displayHost}:${PORT}/auth                  ║
║                                                           ║
║   ⚠️  Don't forget to configure .env file                ║
║   ⚠️  Get credentials from Google Cloud Console           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
