import "dotenv/config";

import { Worker } from "bullmq";

import prisma from "../config/prisma";

import { redis } from "../config/redis";

import {

    canSendMessage,

    incrementMessageCount

}

    from "../lib/services/rate-limit/rate-limit.service";

import {

    sendInstagramDM

}

    from "../lib/services/messaging/instagram.service";

import {

    privateDMReplyToComment,
    publicReplyToComment

}

    from "../lib/services/messaging/comment.service";


const worker = new Worker(

    "outbound-messages",

    async (job) => {
        console.log(
            "Job Received",
            job.id
        )
        const {

            eventId

        } = job.data;


        const event =
            await prisma.metaEvents.findUnique({

                where: {

                    id: eventId

                }

            })


        if (!event) {

            return

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


            const rateLimit =
                await canSendMessage(
                    event.igUserId
                )


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
                    nextHour.getTime(),
                    job.token
                )

                return

            }


            const automation =
                await prisma.automation.findUnique({

                    where: {

                        id:
                            event.automationId

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


            let response;

            switch (

            event.triggerType

            ) {

                case "COMMENT": {

                    const replyMessage =

                        automation.commentReplies?.length

                            ?

                            automation.commentReplies[

                            Math.floor(

                                Math.random()

                                *

                                automation.commentReplies.length

                            )

                            ]

                            :

                            "Check your DM"


                    await publicReplyToComment(

                        oauth.accessToken,

                        event.commentId!,

                        replyMessage

                    )


                    response =
                        await privateDMReplyToComment(
                            oauth.accessToken,
                            event.commentId || "",
                            automation.messageTemplate || "",
                            event.igUserId
                        )
                    break

                }


                case "DM":

                case "STORY_REPLY": {

                    response =
                        await sendInstagramDM(

                            oauth.accessToken,

                            event.recipientIgId,

                            automation.messageTemplate || ""

                        )

                    break

                }

            }


            await incrementMessageCount(

                rateLimit.key

            )


            await prisma.metaEvents.update({

                where: {

                    id:
                        event.id

                },

                data: {

                    status:
                        "COMPLETED",

                    processedAt:
                        new Date()

                }

            })


        }

        catch (error) {

            await prisma.metaEvents.update({

                where: {

                    id:
                        event.id

                },

                data: {

                    status:
                        "FAILED",
                    errorLog: (error as any).toString()

                }

            })


            throw error

        }

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

worker.on(

    "completed",

    (job) => {

        console.log(

            `Completed Job ${job.id}`

        )

    }

)

worker.on(

    "failed",

    (job, err) => {

        console.log(

            `Failed Job ${job?.id}`,

            err

        )

    }

)

worker.on(

    "error",

    (err) => {

        console.log(

            "Worker Error",

            err

        )

    }

)

worker.on("stalled", (jobId) => {
    console.log("Stalled job:", jobId)
})