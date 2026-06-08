import {
    findCommentAutomation
} from "../automation.service";

import {
    createEventQueue
} from "../event.service";

import {
    publishOutboundJob
} from "../../../../queues/outbound.queue";

export async function processCommentEvents(
    events: any[],
    payload: any
) {

    for (
        const event
        of events
    ) {

        const automation =
            await findCommentAutomation(

                event.igUserId,

                event.mediaId,

                event.comment

            )

        if (
            !automation
        ) {

            continue

        }

        const dbEvent =
            await createEventQueue({

                igUserId:
                    event.igUserId,

                automationId:
                    automation.id,

                recipientIgId:
                    event.senderId,

                message:
                    event.comment,

                dedupeKey:
                    event.dedupeKey,

                rawPayload:
                    payload,

                triggerType:
                    "COMMENT",

                commentId:
                    event.commentId,

                mediaId:
                    event.mediaId

            })

        publishOutboundJob(dbEvent.id);
    }

}