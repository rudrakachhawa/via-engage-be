import amqp, { Channel, Connection } from "amqplib";

export const QUEUE_NAME = "outbound-messages";
export const DLX_NAME = "outbound-messages.dlx";
export const RETRY_QUEUE = "outbound-messages.retry";

let connection: Awaited<ReturnType<typeof amqp.connect>>;
let channel: Channel;

export async function connectRabbitMQ() {
    connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();

    // Main queue — failed messages go to DLX
    await channel.assertQueue(QUEUE_NAME, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": DLX_NAME,
        },
    });

    // DLX exchange
    await channel.assertExchange(DLX_NAME, "direct", { durable: true });

    // Retry queue: messages sit here for 1 hour, then re-enter main queue
    await channel.assertQueue(RETRY_QUEUE, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": "",           // default exchange
            "x-dead-letter-routing-key": QUEUE_NAME, // back to main queue
            "x-message-ttl": 60 * 60 * 1000,        // 1 hour (matches your nextHour logic)
        },
    });

    await channel.bindQueue(RETRY_QUEUE, DLX_NAME, QUEUE_NAME);

    // Concurrency = 3 (matches your BullMQ concurrency option)
    await channel.prefetch(3);

    console.log("RabbitMQ connected");
    return channel;
}

export function getChannel(): Channel {
    if (!channel) throw new Error("RabbitMQ channel not initialized");
    return channel;
}

// Replaces: outboundQueue.add("process-event", { eventId }, { jobId: `dm-${dedupeKey}` })
export function publishOutboundJob(eventId: string) {
    getChannel().sendToQueue(
        QUEUE_NAME,
        Buffer.from(JSON.stringify({ eventId })),
        { persistent: true, contentType: "application/json" }
    );
}