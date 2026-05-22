import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

const automationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const automationId = req.params?.automationId || req.body?.automationId || req.query?.automationId;

    if (!automationId) {
      return res.status(400).json({ message: 'automationId is required' });
    }

    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }

    if (!automation.igUserId) {
      return res.status(404).json({ message: 'No instagram account linked with automation' });
    }

    const [instaAccount, instaOauth] = await Promise.all([
      prisma.instaAccount.findUnique({ where: { igUserId: automation.igUserId } }),
      prisma.instaAccountOauth.findUnique({ where: { igUserId: automation.igUserId } }),
    ]);

    if (!instaAccount || !instaOauth) {
      return res.status(404).json({ message: 'Instagram account not found' });
    }

    (req as any).user.igData = { instaAccount, instaOauth };
    (req as any).user.automation = automation;

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default automationMiddleware