import express, { Request, Response } from "express";
import verifyFirebaseToken from "../middlewares/user.middleware";
import { removeInstaAccount } from "../controllers/user.controller";

const router = express.Router();

router.post(
    "/login",
    verifyFirebaseToken,
    async (req: Request, res: Response) => {
        // req.user should have been attached by the middleware (see middlewares/auth.middleware.ts)
        return res.json({
            success: true,
            user: (req as any).user,
        });
    }
);

router.delete(
    "/insta-account/:id",
    verifyFirebaseToken,
    removeInstaAccount
);

export default router;