import { Request, Response } from 'express';
import prisma from '../config/prisma';
import axios from 'axios';

// type can be STORY or FEED. FEED means both REEL and POST.

export async function getUserMedia(req: Request, res: Response) {
    try {
        const oauth = (req as any).user?.igData?.instaOauth
        let { type } = req.query as { type?: string };
        // type is optional filter — STORY or FEED
        // Default type is FEED
        if (!type) {
            type = 'FEED';
        }

        // check token not expired
        if (oauth.expiresAt && new Date() > oauth.expiresAt) {
            return res.status(401).json({ error: 'Access token expired' });
        }

        // fetch media from Meta
        const fields =
            'id,media_type,media_product_type,thumbnail_url,media_url,permalink,caption,timestamp';
        const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${oauth.accessToken}`;

        const response = await axios.get(url);
        const data = response.data;

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        // normalize
        let media = Array.isArray(data.data)
            ? data.data.map((item: any) => ({
                id: item.id,
                type: normalizeType(item.media_type, item.media_product_type),
                thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
                permalink: item.permalink,
                caption: item.caption ?? null,
                timestamp: item.timestamp,
            }))
            : [];

        // Handle type: only STORY or FEED
        // If type = STORY, show only stories (fetched from stories endpoint)
        // If type = FEED, show both REEL and POST (from main endpoint)
        let resultMedia: typeof media = [];

        if (type) {
            if (type.toUpperCase() === 'STORY') {
                // Only stories
                const stories = await fetchStories(oauth.accessToken);
                resultMedia = stories;
            } else if (type.toUpperCase() === 'FEED') {
                // Only posts and reels
                resultMedia = media.filter(
                    (item: { type: string }) => item.type === 'REEL' || item.type === 'POST'
                );
            } else {
                // Not a recognized type, return error
                return res.status(400).json({ error: 'Invalid media type. Allowed: STORY or FEED.' });
            }
        }

        return res.status(200).json({ media: resultMedia });
    } catch (err) {
        console.error('getUserMedia error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// stories are on a different Meta endpoint
async function fetchStories(accessToken: string): Promise<
    Array<{
        id: string;
        type: string;
        thumbnailUrl: string | null;
        permalink: string | null;
        caption: null;
        timestamp: string;
    }>
> {
    try {
        const fields = 'id,media_type,media_url,thumbnail_url,permalink,timestamp';
        const url = `https://graph.instagram.com/me/stories?fields=${fields}&access_token=${accessToken}`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.error || !Array.isArray(data.data)) return [];

        return data.data.map((item: any) => ({
            id: item.id,
            type: 'STORY',
            thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
            permalink: item.permalink ?? null,
            caption: null,
            timestamp: item.timestamp,
        }));
    } catch {
        return []; // stories failing shouldn't break the whole request
    }
}

// Meta returns IMAGE/VIDEO + media_product_type to determine post vs reel
function normalizeType(mediaType: string, mediaProductType: string): string {
    if (mediaProductType === 'REELS') return 'REEL';
    if (mediaProductType === 'STORY') return 'STORY';
    return 'POST'; // IMAGE or VIDEO on FEED
}
