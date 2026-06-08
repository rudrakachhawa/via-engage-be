import amqp, { Channel } from "amqplib";

export const QUEUE_NAME = "outbound-messages";
export const DLX_NAME = "outbound-messages.dlx";
export const RETRY_QUEUE = "outbound-messages.retry";

let producerChannel: Channel;
let consumerChannel: Channel;

async function setupQueues(channel: Channel) {
  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX_NAME,
    },
  });

  await channel.assertExchange(DLX_NAME, "direct", { durable: true });

  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": QUEUE_NAME,
      "x-message-ttl": 60 * 60 * 1000,
    },
  });

  await channel.bindQueue(RETRY_QUEUE, DLX_NAME, QUEUE_NAME);
}

// Called by app.ts — producer only, no prefetch, no consume
export async function connectProducer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);

  connection.on("error", (err) => console.error("RabbitMQ producer error", err));
  connection.on("close", () => console.warn("RabbitMQ producer connection closed"));

  producerChannel = await connection.createChannel();
  await setupQueues(producerChannel);
  console.log("RabbitMQ producer connected");
}

// Called by outbound.worker.ts — consumer with prefetch
export async function connectWorker(): Promise<Channel> {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);

  connection.on("error", (err) => console.error("RabbitMQ worker error", err));
  connection.on("close", () => {
    console.warn("RabbitMQ worker connection closed, restarting in 5s...");
    setTimeout(() => connectWorker(), 5000);
  });

  consumerChannel = await connection.createChannel();
  await setupQueues(consumerChannel);
  await consumerChannel.prefetch(3);
  console.log("RabbitMQ worker connected");
  return consumerChannel;
}

export function getChannel(): Channel {
  if (!producerChannel) throw new Error("Producer channel not initialized");
  return producerChannel;
}

export function publishOutboundJob(eventId: string) {
  getChannel().sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify({ eventId })),
    { persistent: true, contentType: "application/json" }
  );
}