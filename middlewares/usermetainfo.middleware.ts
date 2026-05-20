import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure that req.user.igUserId exists.
 * Throws a 400 error if not present (i.e., user has not connected an Instagram account yet).
 */
const requireInstaUser = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = (req as any).user;
    if (!user || !user.igUserId) {
        return res.status(400).json({ error: 'Instagram account is not connected yet' });
    }
    next();
};

export default requireInstaUser;