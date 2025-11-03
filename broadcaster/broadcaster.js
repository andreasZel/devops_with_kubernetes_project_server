import { connect, StringCodec, AckPolicy } from "nats";
import dotenv from 'dotenv';

dotenv.config();

const {
    NATS_URL,
    DISCORD_WEBHOOK_URL
} = process.env;

const missingEnvVars = [];
const logOnly = process?.env?.LOG_ONLY === "true";

if (!NATS_URL) missingEnvVars.push('NATS_URL');
if (!DISCORD_WEBHOOK_URL) missingEnvVars.push('DISCORD_WEBHOOK_URL');

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

console.log(`Starting broadcaster in ${logOnly ? 'LOG_ONLY' : 'NORMAL'} mode`);

const sc = StringCodec();

async function sendToDiscord(message) {
    if (logOnly) {
        console.log("LOG_ONLY mode: Would have sent to Discord:", message);
        return;
    }

    await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
    });
}

async function run() {
    const nc = await connect({ servers: NATS_URL });
    console.log("✅ Connected to NATS");
    
    const js = nc.jetstream();
    const jsm = await nc.jetstreamManager();

    await jsm.consumers.add("EVENTS", {
        durable_name: "worker-group",
        ack_policy: AckPolicy.Explicit,
        filter_subjects: ["events.job"],
    });
    console.log("Pull consumer created");

    const consumer = await js.consumers.get("EVENTS", "worker-group");
    console.log("Consumer started, fetching messages...");

    while (true) {
        try {
            const messages = await consumer.fetch({ max_messages: 10, expires: 30000 });
            
            for await (const m of messages) {
                const data = sc.decode(m.data);
                console.log(`received: ${data}`);
                
                try {
                    await sendToDiscord(data);
                    m.ack();
                    console.log(`✅ Message sent and acked`);
                } catch (err) {
                    console.error(`❌ Error:`, err);
                    m.nak();
                }
            }
        } catch (err) {
            if (err.code !== '408') {
                console.error(`Error fetching:`, err);
            }
        }
    }
}

run().catch(console.error);