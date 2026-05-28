import prisma from "../../../config/prisma"

export async function createEventQueue(
    data: {

        igUserId: string

        automationId: string

        recipientIgId: string

        message: string

        dedupeKey: string

        rawPayload: any

    }
) {
    return prisma.metaEvents.create({

        data: {

            igUserId:
                data.igUserId,

            automationId:
                data.automationId,

            triggerType:
                "DM",

            recipientIgId:
                data.recipientIgId,

            commentText:
                data.message,

            rawPayload:
                data.rawPayload,

            dedupeKey:
                data.dedupeKey,

            expiresAt:
                new Date(
                    Date.now() +
                    1000 *
                    60 *
                    60 *
                    24
                )

        }

    })

}