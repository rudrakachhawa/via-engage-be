import {
    findAutomationById
} from "../automation.service";

import {
    createEventQueue
} from "../event.service";

import { publishOutboundJob } from "../../../../queues/outbound.queue";

export async function processPostBackEvents(
    events: any[],
    payload: any
) {

    for (
        const event
        of events
    ) {
        const automation =
            await findAutomationById(event.automationId)
        if (!automation) {

            continue

        }

        const dbEvent =
            await createEventQueue({

                igUserId:
                    automation.igUserId || "",

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
                    "POSTBACK_MESSAGE"

            })

        publishOutboundJob(dbEvent.id)

    }

}