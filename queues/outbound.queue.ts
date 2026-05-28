// workers/outbound.worker.ts
import { Queue } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL!);

export const outboundQueue = new Queue("outbound-messages", {
    connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port) || 6379,
        password: redisUrl.password || undefined,
        tls: redisUrl.protocol === "rediss:" ? {} : undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    },
});