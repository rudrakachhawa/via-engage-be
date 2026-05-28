import { processCommentEvents } from "./handlers/comment.handler"
import { processDmEvents } from "./handlers/dm.handler"
import { processStoryEvents } from "./handlers/story.handler"
import {
    parseDmWebhook,

    parseStoryWebhook,

    parseCommentWebhook,

    detectWebhookTypes

}
    from "./parser.service"



export async function processWebhookPayload(
    payload: any
) {

    const types =
        detectWebhookTypes(
            payload
        )

    if (
        types.hasMessaging
    ) {

        await processDmEvents(
            parseDmWebhook(
                payload
            ),

            payload
        )

        await processStoryEvents(

            parseStoryWebhook(
                payload
            ),

            payload

        )

    }

    if (
        types.hasComments
    ) {

        await processCommentEvents(

            parseCommentWebhook(
                payload
            ),

            payload

        )

    }

}