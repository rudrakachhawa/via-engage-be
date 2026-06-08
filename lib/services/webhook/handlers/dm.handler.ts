import { publishOutboundJob } from "../../../../queues/outbound.queue";
import {
    findDmAutomation
} from "../automation.service";

import {
    createEventQueue
} from "../event.service";



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

        publishOutboundJob(dbEvent.id);
    }

}