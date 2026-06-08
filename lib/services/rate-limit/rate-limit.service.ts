import { redis } from "../../../config/redis";

export async function canSendMessage(
    igUserId: string
) {
    const hourBucket =
        new Date()
            .toISOString()
            .slice(0, 13)
    const key =
        `rate-limit:${igUserId}:${hourBucket}`
    return {

        allowed:
            true,

        key,

        count: 10

    }


    const count =
        Number(
            await redis.get(key)
        ) || 0

    return {

        allowed:
            count < 200,

        key,

        count

    }

}

export async function incrementMessageCount(
    key: string
) {
    return true
    const value =
        await redis.incr(
            key
        )

    if (
        value === 1
    ) {

        await redis.expire(
            key,
            3600
        )

    }

}