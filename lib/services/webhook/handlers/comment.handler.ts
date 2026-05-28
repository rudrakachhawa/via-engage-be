import {
    findCommentAutomation
} from "../automation.service";

import {
    createEventQueue
} from "../event.service";

import {
    outboundQueue
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
        // Check if this job already exists in the queue
        const jobId = `comment-${event.dedupeKey}`
        const existingJob = await outboundQueue.getJob(jobId)

        if (existingJob) {
            console.log("Duplicate job skipped:", jobId)
            continue  // skip DB insert entirely
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

        await outboundQueue.add(

            "process-event",

            {

                eventId:
                    dbEvent.id

            },

            {

                jobId:
                    `comment-${dbEvent.dedupeKey}`,
                removeOnComplete: true

            }
        )

    }

}