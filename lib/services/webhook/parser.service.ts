export function parseDmWebhook(
    payload: any
) {

    const events: {

        igUserId: string

        senderId: string

        message: string

        messageId: string

        timestamp: number

    }[] = []

    const entries =
        payload?.entry || []

    for (const entry of entries) {

        const messaging =
            entry.messaging || []

        for (const msg of messaging) {
            const text =
                msg?.message?.text

            if (!text) {
                continue
            }

            if (
                msg.message?.is_echo
            ) {
                continue
            }

            events.push({

                igUserId:
                    msg.recipient.id,

                senderId:
                    msg.sender.id,

                message:
                    text,

                messageId:
                    msg.timestamp.toString(),

                timestamp:
                    msg.timestamp

            })

        }

    }

    return events

}

export function parseStoryWebhook(
    payload: any
) {

    const events: any[] = []

    const entries =
        payload?.entry || []

    for (
        const entry
        of entries
    ) {

        const messaging =
            entry.messaging || []

        for (
            const msg
            of messaging
        ) {
            const storyReply =
                msg?.reply_to

            if (
                !storyReply
            ) {

                continue

            }

            const text =
                msg?.message?.text

            if (
                !text
            ) {

                continue

            }

            events.push({

                igUserId:
                    msg.recipient.id,

                senderId:
                    msg.sender.id,

                storyId:
                    storyReply.story?.id ||

                    storyReply.story?.story_id ||

                    storyReply.id,

                message:
                    text,


                messageId:
                    msg.timestamp.toString(),

            })

        }

    }

    return events

}

export function parseCommentWebhook(
    payload: any
) {

    const events: any[] = []

    const entries =
        payload?.entry || []

    for (
        const entry
        of entries
    ) {

        const changes =
            entry.changes || []

        for (
            const change
            of changes
        ) {

            if (
                change.field !==
                "comments"
            ) {

                continue

            }

            const value =
                change.value

            const text =
                value?.text

            if (
                !text
            ) {

                continue

            }
            events.push({

                igUserId:
                    entry.id,

                senderId:
                    value.from.id,

                mediaId:
                    value.media.id,

                commentId:
                    value.id,

                comment:
                    text,

                username:
                    value.from.username,

                dedupeKey:
                    value.id,
                messageId:
                    entry.time.toString(),
            })

        }

    }

    return events

}


export function detectWebhookTypes(
    payload: any
) {

    const result = {

        hasMessaging: false,

        hasComments: false

    }

    const entries =
        payload?.entry || []

    for (
        const entry
        of entries
    ) {

        if (
            entry.messaging?.length
        ) {

            result.hasMessaging =
                true
        }

        if (
            entry.changes?.length
        ) {

            result.hasComments =
                true
        }

    }

    return result

}