import express, { Request, Response } from "express";
import verifyFirebaseToken from "../middlewares/user.middleware";

const router = express.Router();

router.post(
    "/login",
    verifyFirebaseToken,
    async (req: Request, res: Response) => {
        // req.user should have been attached by the middleware (see middlewares/auth.middleware.ts)
        console.log((req as any).user);

        return res.json({
            success: true,
            user: (req as any).user,
        });
    }
);

export default router;