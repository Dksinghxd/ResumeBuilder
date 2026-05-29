import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';

describe('jwt utilities', () => {
  it('round-trips access tokens', () => {
    const token = generateAccessToken({
      userId: '507f1f77bcf86cd799439011',
      email: 'demo@example.com',
      role: 'user',
    });

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe('507f1f77bcf86cd799439011');
    expect(decoded.email).toBe('demo@example.com');
    expect(decoded.role).toBe('user');
  });

  it('round-trips refresh tokens', () => {
    const token = generateRefreshToken({
      userId: '507f1f77bcf86cd799439011',
      email: 'demo@example.com',
    });

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe('507f1f77bcf86cd799439011');
    expect(decoded.email).toBe('demo@example.com');
  });
});
