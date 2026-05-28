import express, { Request, Response } from "express";
import { findDmAutomation } from "../lib/services/webhook/automation.service";
import { createEventQueue } from "../lib/services/webhook/event.service";
import { outboundQueue } from "../queues/outbound.queue";
import { parseDmWebhook } from "../lib/services/webhook/parser.service";

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

            const payload =
                req.body;

            const events =
                parseDmWebhook(
                    payload
                )

            for (
                const webhookEvent
                of events
            ) {

                const automation =
                    await findDmAutomation(

                        webhookEvent.igUserId,

                        webhookEvent.message

                    )

                if (!automation) {

                    continue

                }

                const event =
                    await createEventQueue({

                        igUserId:
                            webhookEvent.igUserId,

                        automationId:
                            automation.id,

                        recipientIgId:
                            webhookEvent.senderId,

                        message:
                            webhookEvent.message,

                        dedupeKey:
                            webhookEvent.messageId,

                        rawPayload:
                            payload

                    })
                await outboundQueue.add(

                    "process-event",

                    {

                        eventId:
                            event.id

                    },

                    {

                        jobId: `event${event.dedupeKey}`

                    }

                )

            }

            return res
                .status(200)
                .json({

                    success: true

                })

        }

        catch (error) {

            console.log(error)

            return res
                .status(500)
                .json({

                    success: false

                })

        }

    }

)

export default router;