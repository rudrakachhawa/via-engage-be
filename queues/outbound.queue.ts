import amqp, { Channel } from "amqplib";

export const QUEUE_NAME = "outbound-messages";
export const DLX_NAME = "outbound-messages.dlx";
export const RETRY_QUEUE = "outbound-messages.retry";

let channel: Channel;

async function setupQueues(ch: Channel) {
    await ch.assertQueue(QUEUE_NAME, {
        durable: true,
        arguments: { "x-dead-letter-exchange": DLX_NAME },
    });
    await ch.assertExchange(DLX_NAME, "direct", { durable: true });
    await ch.assertQueue(RETRY_QUEUE, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": QUEUE_NAME,
            "x-message-ttl": 60 * 60 * 1000,
        },
    });
    await ch.bindQueue(RETRY_QUEUE, DLX_NAME, QUEUE_NAME);
}

export async function connectRabbitMQ(): Promise<Channel> {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);

    connection.on("error", (err) => console.error("RabbitMQ error", err));
    connection.on("close", () => {
        console.warn("RabbitMQ connection closed, reconnecting in 5s...");
        setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();
    await setupQueues(channel);
    await channel.prefetch(3);
    console.log("RabbitMQ connected");
    return channel;
}

export function getChannel(): Channel {
    if (!channel) throw new Error("Channel not initialized");
    return channel;
}

export function publishOutboundJob(eventId: string) {
    getChannel().sendToQueue(
        QUEUE_NAME,
        Buffer.from(JSON.stringify({ eventId })),
        { persistent: true, contentType: "application/json" }
    );
}