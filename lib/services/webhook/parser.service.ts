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
            console.log(msg, "-0-0-0-0-0-")
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