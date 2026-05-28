import axios from "axios";

export async function sendInstagramDM(
    accessToken: string,
    _igUserId: string, // Will be ignored in this implementation, to match /me/messages usage
    recipientId: string,
    message: string
) {
    const response = await axios.post(
        "https://graph.instagram.com/v25.0/me/messages",
        {
            message: {
                text: message
            },
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
}