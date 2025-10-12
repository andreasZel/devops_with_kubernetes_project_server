import { connect, StringCodec } from "nats";
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

    try {
        await jsm.consumers.add("EVENTS", {
            durable_name: "worker-group",
            ack_policy: "explicit",
            deliver_subject: "deliver.worker-group",
        });

        console.log("Consumer created");

    } catch (err) {
        if (!err.message.includes("consumer name already in use")) throw err;
    }

    const sub = nc.subscribe("deliver.worker-group", { queue: "my-workers" });

    console.log(`Consumer started`);

    for await (const m of sub) {
        const data = sc.decode(m.data);
        console.log(`received: ${data}`);

        try {
            await sendToDiscord(data);
            m.ack();
            console.log(`Message sent to Discord and acknowledged`);
        } catch (err) {
            console.error(`Error sending to Discord:`, err);
            m.nak(); 
        }
    }
}

run().catch(console.error);
