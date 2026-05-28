import "dotenv/config";

import {
    Worker
}
    from "bullmq";



import {
    redis
}
    from "../config/redis";
import prisma from "../config/prisma";

import {

    canSendMessage,

    incrementMessageCount

}

    from "../lib/services/rate-limit/rate-limit.service";

import {

    sendInstagramDM

}

    from "../lib/services/messaging/instagram.service";

new Worker(

    "outbound-messages",

    async (job) => {

        const {
            eventId
        } = job.data;

        const event =
            await prisma
                .metaEvents
                .findUnique({

                    where: {
                        id: eventId
                    }

                })

        if (!event) {

            return

        }

        const rateLimit =
            await canSendMessage(
                event.igUserId
            )
        console.log(rateLimit)
        if (
            !rateLimit.allowed
        ) {

            console.log(
                "Rate Limited"
            )

            const nextHour =
                new Date()

            nextHour.setHours(
                nextHour.getHours() + 1
            )

            nextHour.setMinutes(
                0,
                0,
                0
            )

            await job.moveToDelayed(
                nextHour.getTime()
            )

            return

        }
        const automation =
            await prisma.automation.findUnique({

                where: {
                    id: event.automationId
                },

                include: {
                    instaAccount: true
                }

            })

        if (!automation) {

            throw new Error(
                "Automation missing"
            )

        }

        const oauth =
            await prisma
                .instaAccountOauth
                .findUnique({

                    where: {

                        igUserId:
                            event.igUserId

                    }

                })

        if (!oauth) {

            throw new Error(
                "OAuth missing"
            )

        }

        try {

            await prisma.metaEvents.update({

                where: {
                    id: event.id
                },

                data: {
                    status: "PROCESSING"
                }

            })

            const response =
                await sendInstagramDM(

                    oauth.accessToken,

                    event.igUserId,

                    event.recipientIgId,

                    automation.messageTemplate || ""

                )

            await incrementMessageCount(
                rateLimit.key
            )

            await prisma.metaEvents.update({

                where: {
                    id: event.id
                },

                data: {

                    status:
                        "COMPLETED",

                    processedAt:
                        new Date()

                }

            })

            console.log(
                response
            )

        }

        catch (error) {

            console.log(
                error
            )

            await prisma.metaEvents.update({

                where: {
                    id: event.id
                },

                data: {

                    status:
                        "FAILED"

                }

            })

            throw error

        }

        await prisma
            .metaEvents
            .update({

                where: {
                    id: event.id
                },

                data: {

                    status:
                        "COMPLETED",

                    processedAt:
                        new Date()

                }

            })

    },

    {

        connection:
            redis,

        concurrency:
            3

    }

)

console.log(
    "Outbound Worker Started"
)