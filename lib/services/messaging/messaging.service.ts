import axios from "axios";

export async function sendInstagramDM(
    accessToken: string,
    recipientId: string,
    messagePayload: { [key: string]: any }
) {
    try {
        const response = await axios.post(
            "https://graph.instagram.com/v25.0/me/messages",
            {
                message: { ...messagePayload },
                recipient: {
                    id: recipientId
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
    } catch (error) {
        console.log("ERROR SENDING INSTAGRAM DM", (error as any)?.message)
        throw error
    }
}