import { Request, Response, NextFunction } from 'express';
import admin from "../config/firebaseAdminSDK";
import prisma from '../config/prisma';

const verifyFirebaseToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : undefined;

        if (!token) {
            return res.status(401).json({
                message: "No token",
            });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        // FIND USER and include instaAccounts
        let user = await prisma.user.findUnique({
            where: {
                firebaseUuid: decodedToken.uid,
            },
            include: {
                instaAccounts: true
            }
        });

        // CREATE USER if not exists (and fetch instaAccounts)
        if (!user) {
            user = await prisma.user.create({
                data: {
                    firebaseUuid: decodedToken.uid,
                    email: decodedToken.email ?? '', // Ensure non-undefined string
                    name: decodedToken.name,
                    avatar: decodedToken.picture,
                },
                include: {
                    instaAccounts: true
                }
            });
        }

        (req as any).user = { ...user };

        next();
    } catch (err) {
        console.error('Firebase token verification failed:', err);

        return res.status(401).json({
            message: "Invalid token",
        });
    }
};

export default verifyFirebaseToken;