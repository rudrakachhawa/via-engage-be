import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

/**
 * Middleware to fetch and add instaUser OAuth data from instaUserOauth table to req.user.oauth
 * Assumes:
 *   - req.user exists and has a .id property (user PK from DB)
 *   - instaUser is uniquely associated with user.id
 *   - instaUserOauth is associated with instaUser's id (assumed via instaUserId FK)
 */
const attachInstaUserOauth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = (req as any).user;
        if (!user || !user.id) {
            return res.status(400).json({ error: 'User not found on request' });
        }

        // Find instaUser by user.id (must exist to link to instaUserOauth)
        const instaUser = await prisma.instaUser.findUnique({
            where: { userId: user.id },
        });

        let oauthData = {};

        if (instaUser && instaUser.igUserId) {
            // Fetch the oauth record from instaUserOauth table
            const instaUserOauth = await prisma.instaOauth.findUnique({
                where: { igUserId: instaUser.igUserId, userId: instaUser.userId },
            });
            oauthData = instaUserOauth ? instaUserOauth : {};
        }

        (req as any).user.oauth = oauthData;
        next();
    } catch (err) {
        console.error('Attaching instaUserOauth failed:', err);
        return res.status(500).json({ error: 'Failed to attach instaUserOauth' });
    }
};

export default attachInstaUserOauth;