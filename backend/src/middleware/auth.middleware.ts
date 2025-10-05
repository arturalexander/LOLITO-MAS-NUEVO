import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET!;

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (user.tokenExpiry < new Date()) {
      return res.status(401).json({ 
        error: 'Facebook token expired',
        needsReauth: true 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireInstagram = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.instagramAccountId) {
    return res.status(400).json({ 
      error: 'Instagram account not connected',
      message: 'Please connect your Instagram Business account first'
    });
  }

  next();
};

export const requireFacebookPage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.pageId || !req.user.pageAccessToken) {
    return res.status(400).json({ 
      error: 'Facebook Page not connected',
      message: 'Please connect your Facebook Page first'
    });
  }

  next();
};

export default { authenticateUser, requireInstagram, requireFacebookPage };
