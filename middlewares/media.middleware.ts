import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

const mediaMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const igUserId = req.params?.igUserId || req.body?.igUserId || req.query?.igUserId;

    if (!igUserId) {
      return res.status(400).json({ message: 'igUserId is required' });
    }

    const [instaAccount, instaOauth] = await Promise.all([
      prisma.instaAccount.findUnique({ where: { igUserId } }),
      prisma.instaAccountOauth.findUnique({ where: { igUserId } }),
    ]);

    if (!instaAccount || !instaOauth) {
      return res.status(404).json({ message: 'Instagram account not found' });
    }

    // Optional: verify this igUserId belongs to the authenticated user
    if (instaAccount.userId !== (req as any).user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    (req as any).user.igData = { instaAccount, instaOauth };

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default mediaMiddleware;