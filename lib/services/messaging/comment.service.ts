import axios from "axios";

export async function publicReplyToComment(

    accessToken: string,

    commentId: string,

    message: string

) {

    const response =
        await axios.post(
            `https://graph.instagram.com/v25.0/${commentId}/replies`,
            {},
            {
                params: {
                    message
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )


    return response.data

}

export async function privateDMReplyToComment(
    accessToken: string,
    comment_id: string,
    messagePayload: { [key: string]: any; },
    igUserId: string
) {
    console.log(messagePayload)
    const response = await axios.post(
        `https://graph.instagram.com/v25.0/${igUserId}/messages`,
        {
            "message": {
                ...messagePayload
            },
            recipient: {
                comment_id: comment_id
            }
        },
        {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}