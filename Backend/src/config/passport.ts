import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import config from './environment.js';
import UserModel from '../models/User.js';
import logger from '../utils/logger.js';

// Google OAuth Strategy
if (config.oauth?.google?.clientID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientID,
        clientSecret: config.oauth.google.clientSecret || '',
        callbackURL: config.oauth.google.callbackURL || '',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find or create user
          let user = await UserModel.findOne({ email: profile.emails?.[0]?.value });

          if (!user) {
            // Create new user from Google profile
            user = await UserModel.create({
              firstName: profile.name?.givenName || 'User',
              lastName: profile.name?.familyName || '',
              email: profile.emails?.[0]?.value,
              provider: 'google',
              providerId: profile.id,
              profileImage: profile.photos?.[0]?.value,
              status: 'active',
              emailVerified: true, // Google verified emails
            });
            logger.info('New user created via Google OAuth', { email: user.email });
          } else if (!user.providerId) {
            // Update existing user with OAuth provider info
            user.provider = 'google';
            user.providerId = profile.id;
            user.emailVerified = true;
            await user.save();
          }

          done(null, user);
        } catch (error) {
          logger.error('Google OAuth error', error);
          done(error);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth credentials not provided. Google login will be disabled.');
}

// GitHub OAuth Strategy
if (config.oauth?.github?.clientID) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.oauth.github.clientID,
        clientSecret: config.oauth.github.clientSecret || '',
        callbackURL: config.oauth.github.callbackURL || '',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find or create user
          let user = await UserModel.findOne({
            $or: [
              { email: profile.emails?.[0]?.value },
              { providerId: profile.id },
            ],
          });

          if (!user) {
            // Create new user from GitHub profile
            user = await UserModel.create({
              firstName: profile.name?.split(' ')?.[0] || profile.username || 'User',
              lastName: profile.name?.split(' ')?.[1] || '',
              email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
              provider: 'github',
              providerId: profile.id,
              profileImage: profile.photos?.[0]?.value,
              status: 'active',
              emailVerified: profile.emails?.[0]?.verified || false,
            });
            logger.info('New user created via GitHub OAuth', { email: user.email });
          } else if (!user.providerId) {
            // Update existing user with OAuth provider info
            user.provider = 'github';
            user.providerId = profile.id;
            await user.save();
          }

          done(null, user);
        } catch (error) {
          logger.error('GitHub OAuth error', error);
          done(error);
        }
      }
    )
  );
} else {
  logger.warn('GitHub OAuth credentials not provided. GitHub login will be disabled.');
}

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
