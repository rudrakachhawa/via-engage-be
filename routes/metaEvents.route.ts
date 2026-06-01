import express, { Request, Response } from "express";
import { processWebhookPayload } from "../lib/services/webhook/dispatcher.service";

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

    async (req, res) => {

        try {
            console.log(JSON.stringify(req.body, null, 2));
            await processWebhookPayload(
                req.body
            )

            return res
                .status(200)
                .json({

                    success: true

                })

        }

        catch (err) {

            console.log(err)

            return res
                .status(500)
                .json({

                    success: false

                })

        }

    }

)

export default router;