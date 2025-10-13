import { connect, StringCodec, AckPolicy } from "nats";
import dotenv from 'dotenv';

dotenv.config();

const {
    NATS_URL,
    DISCORD_WEBHOOK_URL
} = process.env;

const missingEnvVars = [];
if (!NATS_URL) missingEnvVars.push('NATS_URL');
if (!DISCORD_WEBHOOK_URL) missingEnvVars.push('DISCORD_WEBHOOK_URL');

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const sc = StringCodec();

async function sendToDiscord(message) {
    await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
    });
}

async function run() {
    const nc = await connect({ servers: NATS_URL });
    const jsm = await nc.jetstreamManager();
    const js = nc.jetstream();

    try {
        await jsm.streams.info("EVENTS");
        console.log("✅ Stream EVENTS exists");
    } catch (err) {
        console.error("Stream does not exist");
        process.exit(1);
    }

    try {
        await jsm.consumers.info("EVENTS", "worker-group");
        console.log("Consumer already exists");
    } catch (err) {
        await jsm.consumers.add("EVENTS", {
            durable_name: "worker-group",
            ack_policy: AckPolicy.Explicit,
            filter_subject: "events.job",
        });
        console.log("Consumer created");
    }

    const consumer = await js.consumers.get("EVENTS", "worker-group");
    console.log("Consumer started");

    while (true) {
        const messages = await consumer.fetch({ max_messages: 1, expires: 5000 });
        
        for await (const m of messages) {
            const data = sc.decode(m.data);
            console.log(`received: ${data}`);
            await sendToDiscord(data);
            m.ack();
        }
    }
}

run().catch(console.error);