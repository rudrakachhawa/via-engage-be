import prisma from "../../../config/prisma"

export async function createEventQueue(
    data: {

        igUserId: string

        automationId: string

        recipientIgId: string

        message: string

        dedupeKey: string

        rawPayload: any

        triggerType: 'DM' | 'STORY_REPLY' | 'COMMENT' | 'POSTBACK_MESSAGE'

        commentId?: string

        mediaId?: string

    }
) {
    console.log({

        igUserId:
            data.igUserId,

        automationId:
            data.automationId,

        triggerType:
            data.triggerType,

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
            ),
        commentId: data.commentId,
        mediaId: data.mediaId

    }, "Meta event payload")
    return prisma.metaEvents.create({

        data: {

            igUserId:
                data.igUserId,

            automationId:
                data.automationId,

            triggerType:
                data.triggerType,

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
                ),
            commentId: data.commentId,
            mediaId: data.mediaId

        }

    })

}