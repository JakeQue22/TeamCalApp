import { Router, Request, Response } from 'express';
import { getAuthUrl, getTokensFromCode, getUserInfo, refreshAccessToken } from '../google';
import prisma from '../db';

export const authRouter = Router();

// Initiate Google OAuth
authRouter.get('/google', (req: Request, res: Response) => {
  try {
    const authUrl = getAuthUrl(req.sessionID);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// OAuth callback
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code missing' });
    }
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }
    
    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);
    
    if (!userInfo.email) {
      return res.status(400).json({ error: 'Failed to get user email' });
    }
    
    // Calculate token expiry
    const tokenExpiry = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000);
    
    // Find or create user
    const user = await prisma.user.upsert({
      where: { googleId: userInfo.id || "" },
      create: {
        googleId: userInfo.id!,
        email: userInfo.email!,
        name: userInfo.name ?? null,
        picture: userInfo.picture ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token as string | null,
        tokenExpiry,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: (tokens.refresh_token ?? undefined) as string | undefined,
        tokenExpiry,
        name: userInfo.name !== undefined && userInfo.name !== null ? userInfo.name : undefined,
        picture: userInfo.picture !== undefined && userInfo.picture !== null ? userInfo.picture : undefined,
      },
    });
    
    // Create default preferences if not exist
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    
    // Set session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      // Redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      res.redirect(`${frontendUrl}/dashboard`);
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

// Get current user
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if token needs refresh
    if (user.tokenExpiry && user.tokenExpiry < new Date()) {
      if (user.refreshToken) {
        try {
          const newTokens = await refreshAccessToken(user.refreshToken);
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              accessToken: newTokens.access_token,
              tokenExpiry: newTokens.expiry_date 
                ? new Date(newTokens.expiry_date) 
                : new Date(Date.now() + 3600 * 1000),
            },
          });
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Continue with existing token
        }
      }
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Check authentication status
authRouter.get('/status', (req: Request, res: Response) => {
  const isAuthenticated = !!req.session.userId;
  res.json({ authenticated: isAuthenticated });
});
