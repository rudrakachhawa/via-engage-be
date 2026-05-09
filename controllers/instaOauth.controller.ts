import axios from 'axios';
import { Request, Response } from 'express';

const exchangeInstaOauthCode = async (req: Request, res: Response) => {
    try {
        const code = req.body?.code;

        if (!code) {
            return res.status(400).json({ message: 'code is required in request body' });
        }

        // Prefer env vars for secrets
        const clientId = process.env.INSTA_APP_CLIENT_ID;
        const clientSecret = process.env.INSTA_APP_CLIENT_SECRET;
        const redirectUri = process.env.INSTA_APP_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            return res.status(500).json({
                message: 'INSTA_APP_CLIENT_ID, INSTA_APP_CLIENT_SECRET, INSTA_APP_REDIRECT_URI must be set'
            });
        }

        // Step 1: Request short-lived access token
        const data =
            `client_id=${encodeURIComponent(clientId)}` +
            `&client_secret=${encodeURIComponent(clientSecret)}` +
            `&grant_type=authorization_code` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&code=${encodeURIComponent(code)}`;

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.instagram.com/oauth/access_token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        };

        const response = await axios.request(config);

        // Step 2: Exchange short-lived token for long-lived token
        const shortLivedAccessToken = response.data.access_token;

        const longLivedTokenUrl =
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token` +
            `&client_secret=${encodeURIComponent(clientSecret)}` +
            `&access_token=${encodeURIComponent(shortLivedAccessToken)}`;

        const longLivedResponse = await axios.get(longLivedTokenUrl);
        const longLivedResponseData = longLivedResponse.data;

        // Step 3: Get Instagram user info (ID, username, name)
        const meUrl =
            `https://graph.instagram.com/me?fields=user_id,username,name` +
            `&access_token=${encodeURIComponent(longLivedResponseData.access_token)}`;

        const meResponse = await axios.get(meUrl);

        // Step 4: Build scope string
        const permissionsArray = response.data.permissions || [];
        const scope = permissionsArray.join(',');

        // Step 5: Final response
        return res.status(200).json({
            ...longLivedResponseData, // access_token, expires_in
            scope,
            instagram_user_id: meResponse.data.user_id,
            username: meResponse.data.username,
            name: meResponse.data.name
        });
    } catch (error: unknown) {
        const status = axios.isAxiosError(error) ? (error.response?.status ?? 500) : 500;
        return res.status(status).json({
            message: 'Instagram OAuth exchange failed',
            error: error
        });
    }
};

export default exchangeInstaOauthCode;