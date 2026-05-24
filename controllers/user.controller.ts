import { Request, Response } from "express";
import prisma from "../config/prisma";

const socialLogin = async (req: Request, res: Response) => {
    try {
        const decoded = (req as any).user;

        const firebaseUuid: string = decoded?.uid;
        const email: string = decoded?.email;
        const name: string | undefined = decoded?.name;
        const avatar: string | undefined = decoded?.picture;

        // FIND USER
        let user = await prisma.user.findUnique({
            where: {
                firebaseUuid,
            },
        });

        // CREATE USER
        if (!user) {
            user = await prisma.user.create({
                data: {
                    firebaseUuid,
                    email,
                    name,
                    avatar,
                },
            });
        }

        return res.json({
            success: true,
            user,
        });
    } catch (err: unknown) {
        console.log(err);

        let message = "Unexpected error";
        if (err instanceof Error) {
            message = err.message;
        }

        return res.status(500).json({
            message,
        });
    }
};

const removeInstaAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const igAccountId = req.params.id as string;
    if (!igAccountId) {
        return res.status(400).json({ error: "Instagram account ID is required" });
    }
    try {
        const { count } = await prisma.automation.updateMany({
            where: {
                userId,
                igUserId: igAccountId,
            },
            data: {
                isActive: false,
                igUserId: null,
                targetContentId: null,
                targetContentType: null,
                targetContentUrl: null,
                targetThumbnailUrl: null,
            },
        });

        await prisma.instaAccount.delete({
            where: {
                igUserId: igAccountId
            }
        })

        await prisma.instaAccountOauth.delete({
            where: {
                igUserId: igAccountId
            }
        })

        return res.status(200).json({
            success: true,
            updatedAutomations: count,
            message: `Deactivated and ${count} automation(s) paused.`,
        });
    } catch (err) {
        console.error("Failed to deactivate automations for IG account:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export { socialLogin, removeInstaAccount };
