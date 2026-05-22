import axios from 'axios';
import { Request, Response } from 'express';
import prisma from '../config/prisma';

const exchangeInstaOauthCode = async (req: Request & { user?: any }, res: Response) => {
    try {
        const code: string | undefined = req.body?.code;
        if (!code) {
            return res.status(400).json({ message: 'code is required in request body' });
        }

        const clientId = process.env.INSTA_APP_CLIENT_ID;
        const clientSecret = process.env.INSTA_APP_CLIENT_SECRET;
        const redirectUri = process.env.INSTA_APP_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            return res.status(500).json({
                message: 'INSTA_APP_CLIENT_ID, INSTA_APP_CLIENT_SECRET, INSTA_APP_REDIRECT_URI must be set'
            });
        }

        // Step 1: Exchange code for short-lived access token
        const tokenResponse = await axios.post(
            'https://api.instagram.com/oauth/access_token',
            `client_id=${encodeURIComponent(clientId)}` +
            `&client_secret=${encodeURIComponent(clientSecret)}` +
            `&grant_type=authorization_code` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&code=${encodeURIComponent(code)}`,
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                maxBodyLength: Infinity
            }
        );
        const { access_token: shortLivedAccessToken, permissions = [] } = tokenResponse.data;

        // Step 2: Exchange for long-lived token
        const { data: longLived } = await axios.get(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token` +
            `&client_secret=${encodeURIComponent(clientSecret)}` +
            `&access_token=${encodeURIComponent(shortLivedAccessToken)}`
        );

        // Step 3: Fetch IG user info
        const { data: igUser } = await axios.get(
            `https://graph.instagram.com/me?fields=user_id,username,name,profile_picture_url` +
            `&access_token=${encodeURIComponent(longLived.access_token)}`
        );

        const scope = Array.isArray(permissions) ? permissions.join(',') : '';

        // Defensive: Ensure req.user exists and has id
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const igUserData = {
            igUserId: igUser.user_id,
            scope,
            userName: igUser.username,
            name: igUser.name,
            avatar: igUser.profile_picture_url || ""
        };

        await prisma.instaAccount.upsert({
            where: { userId, igUserId: igUser.user_id },
            update: igUserData,
            create: { userId, ...igUserData }
        });

        // Upsert InstaOauth
        const oauthData = {
            igUserId: igUser.user_id,
            accessToken: longLived.access_token,
            expires_in: longLived.expires_in
        };
        await prisma.instaAccountOauth.upsert({
            where: { userId, igUserId: igUser.user_id },
            update: oauthData,
            create: { userId, ...oauthData }
        });

        // Structured final response
        return res.status(200).json({
            ...req.user,
            igData: {
                userId,
                ...igUserData
            }
        });

    } catch (error: any) {
        const status = axios.isAxiosError(error) ? (error.response?.status ?? 500) : 500;
        return res.status(status).json({
            message: 'Instagram OAuth exchange failed',
            error: error?.message || error
        });
    }
};

/**
 * Controller to refresh Instagram long-lived access token and return user info.
 * Expects `access_token` in the request body or (as in the above pattern) from auth context or equivalent.
 * 
 * Request body example:
 * {
 *   "access_token": "<long_lived_access_token>"
 * }
 */
export const refreshInstaToken = async (req: Request, res: Response) => {
    // Try to get long-lived access token from request body or an authenticated context
    // Here: expects access_token in the body as sent by frontend/client
    const longLivedAccessToken =
        req.body?.access_token ||
        req.body?.accesstokencode?.access_token ||
        req.body?.accesstokencode ||
        (req as any)?.authData?.accesstokencode?.access_token;

    if (!longLivedAccessToken) {
        return res.status(400).json({
            message: 'Missing Instagram long-lived access token'
        });
    }

    // Construct refresh token URL
    const refreshTokenUrl =
        `https://graph.instagram.com/refresh_access_token` +
        `?grant_type=ig_refresh_token` +
        `&access_token=${encodeURIComponent(longLivedAccessToken)}`;

    try {
        // Step 1: Refresh the long-lived access token
        const refreshResponse = await axios.get(refreshTokenUrl);

        const refreshedAccessToken = refreshResponse.data.access_token;

        // Step 2: Call /me API with refreshed token
        const meUrl =
            `https://graph.instagram.com/me?fields=user_id,username,name` +
            `&access_token=${encodeURIComponent(refreshedAccessToken)}`;

        const meResponse = await axios.get(meUrl);

        // Step 3: Normalize permissions -> scope
        const updatedResponse: any = {
            ...refreshResponse.data, // access_token, expires_in
            scope: refreshResponse.data.permissions,
            instagram_user_id: meResponse.data.user_id,
            username: meResponse.data.username,
            name: meResponse.data.name
        };

        // Remove original permissions key if it exists
        if ('permissions' in updatedResponse) {
            delete updatedResponse.permissions;
        }

        // Final response
        return res.status(200).json(updatedResponse);

    } catch (error: unknown) {
        const status = axios.isAxiosError(error) ? (error.response?.status ?? 500) : 500;
        return res.status(status).json({
            message: 'Instagram token refresh failed',
            error
        });
    }
};

export default exchangeInstaOauthCode;