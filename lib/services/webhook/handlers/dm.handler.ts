import {
    findDmAutomation
} from "../automation.service";

import {
    createEventQueue
} from "../event.service";

import {
    outboundQueue
} from "../../../../queues/outbound.queue";

export async function processDmEvents(
    events: any[],
    payload: any
) {

    for (
        const event
        of events
    ) {

        const automation =
            await findDmAutomation(

                event.igUserId,

                event.message

            )

        if (!automation) {

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
                    event.message,

                dedupeKey:
                    event.messageId,

                rawPayload:
                    payload,

                triggerType:
                    "DM"

            })

        await outboundQueue.add(

            "process-event",

            {

                eventId:
                    dbEvent.id

            },

            {

                jobId:
                    `dm-${dbEvent.dedupeKey}`

            }

        )

    }

}