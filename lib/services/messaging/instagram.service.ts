import axios from "axios";

export async function getSenderProfileInfo(
    followerIgId: string,
    accessToken: string
) {
    const fields = [
        "name",
        "username",
        "is_user_follow_business"
    ].join(",");
    const url = `https://graph.instagram.com/v25.0/${followerIgId}?fields=${fields}&access_token=${accessToken}`;
    const response = await axios.get(url);
    return response.data;
}