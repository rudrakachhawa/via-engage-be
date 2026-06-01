import { processCommentEvents } from "./handlers/comment.handler"
import { processDmEvents } from "./handlers/dm.handler"
import { processPostBackEvents } from "./handlers/postbackdm.handler"
import { processStoryEvents } from "./handlers/story.handler"
import {
    parseDmWebhook,

    parseStoryWebhook,

    parseCommentWebhook,

    detectWebhookTypes,
    parsePostBackWebhook

}
    from "./parser.service"



export async function processWebhookPayload(
    payload: any
) {

    const types =
        detectWebhookTypes(
            payload
        )
    console.log(types, "types");
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

    if (
        types.isPostBack
    ) {

        await processPostBackEvents(

            parsePostBackWebhook(
                payload
            ),
            payload
        )
    }
}