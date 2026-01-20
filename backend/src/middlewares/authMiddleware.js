/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

class AuthMiddleware {
  /**
   * Authenticate JWT token
   */
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'No token provided'
          }
        });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_002',
              message: 'Token expired'
            }
          });
        }

        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'Invalid token'
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

module.exports = new AuthMiddleware();
