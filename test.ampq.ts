// test-rabbit.ts
import amqp from "amqplib";

async function test() {
    const conn = await amqp.connect(process.env.RABBITMQ_URL!);
    console.log("✅ Connected to RabbitMQ");
    await conn.close();
}

test().catch(console.error);