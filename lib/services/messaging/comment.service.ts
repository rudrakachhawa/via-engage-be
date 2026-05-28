import axios from "axios";

export async function replyToComment(

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