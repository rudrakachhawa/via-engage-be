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

export { socialLogin };
