import express, { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import logger from '../utils/logger.js';

const router = Router();

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );

  return { accessToken, refreshToken };
};

// Google OAuth Routes
router.get(
  '/google',
  (req, res, next) => {
    if (!config.oauth?.google?.clientID) {
      logger.warn('Google OAuth login attempted but not configured');
      return res.redirect('/login?error=oauth_not_configured');
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!config.oauth?.google?.clientID) {
      return res.redirect('/login?error=oauth_not_configured');
    }
    passport.authenticate('google', { failureRedirect: '/login?error=google' })(req, res, next);
  },
  (_req: Request, res: Response) => {
    try {
      const req = _req as any;
      if (!req.user) {
        return res.redirect('/login?error=user_not_found');
      }

      const { accessToken, refreshToken } = generateTokens(req.user._id.toString());

      // Set secure HTTP-only cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      logger.info('User logged in via Google OAuth', { userId: req.user._id });

      // Redirect to dashboard with tokens in URL (for frontend to use)
      res.redirect(
        `/dashboard?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      logger.error('Google OAuth callback error', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);

// GitHub OAuth Routes
router.get(
  '/github',
  (req, res, next) => {
    if (!config.oauth?.github?.clientID) {
      logger.warn('GitHub OAuth login attempted but not configured');
      return res.redirect('/login?error=oauth_not_configured');
    }
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  }
);

router.get(
  '/github/callback',
  (req, res, next) => {
    if (!config.oauth?.github?.clientID) {
      return res.redirect('/login?error=oauth_not_configured');
    }
    passport.authenticate('github', { failureRedirect: '/login?error=github' })(req, res, next);
  },
  (_req: Request, res: Response) => {
    try {
      const req = _req as any;
      if (!req.user) {
        return res.redirect('/login?error=user_not_found');
      }

      const { accessToken, refreshToken } = generateTokens(req.user._id.toString());

      // Set secure HTTP-only cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      logger.info('User logged in via GitHub OAuth', { userId: req.user._id });

      // Redirect to dashboard with tokens in URL (for frontend to use)
      res.redirect(
        `/dashboard?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      logger.error('GitHub OAuth callback error', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);

// Logout
router.post('/logout', (_req: Request, res: Response): void => {
  const req = _req as any;
  req.logout((err: any) => {
    if (err) {
      res.status(500).json({ message: 'Logout failed' });
      return;
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
