import express, { Request, Response } from "express";

const router = express.Router();

router.get(
    "/",
    (req: Request, res: Response) => {
        // Respond with the value of hub.challenge from query as a number.
        const challenge = Number(req.query["hub.challenge"]);
        // Use res.sendStatus if challenge is not a valid number
        if (isNaN(challenge)) {
            // 400 Bad Request if hub.challenge is missing or invalid
            return res.sendStatus(400);
        }
        // Send challenge as plain text (string), not as a number/object
        return res.status(200).send(String(challenge));
    }
);

router.post(
    "/",
    async (req: Request, res: Response) => {
        return res.status(200).json({
            success: true
        });
    }
);

export default router;