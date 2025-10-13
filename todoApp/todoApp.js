import express from 'express';
import dotenv from 'dotenv';
import { connect, StringCodec } from "nats";
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const {
    PORT,
    NATS_URL
} = process.env;

const sc = StringCodec();

async function dbInitAndConnect() {
    var client = null;

    console.log('Connecting to db');

    try {
        client = new Pool({
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
        })


    } catch (e) {
        console.log('Error Connecting to db: ', e)
        return null;
    }

    try {
        await client.query(` CREATE TABLE IF NOT EXISTS todos (
        id BIGSERIAL PRIMARY KEY,
        description VARCHAR(140),
        done boolean
      )`);

        console.log("✅ Table todos check/creation complete.");
    } catch (err) {
        console.error("❌ Error creating todos:", err);
    }

    return client;
}

const missingEnvVars = [];
if (!PORT) missingEnvVars.push('PORT');
if (!NATS_URL) missingEnvVars.push('NATS_URL');

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const port = Number(PORT);
const dbPool = await dbInitAndConnect();

const nc = await connect({ servers: NATS_URL });
const jsm = await nc.jetstreamManager();

try {
    await jsm.streams.add({
        name: "EVENTS",
        subjects: ["events.job"],
    });
    console.log("NATS Stream created");
} catch (err) {
    if (!err.message.includes("stream name already in use")) throw err;
}

const js = nc.jetstream();

var app = express();

app.use(express.json());

app.get('/', (_, res) => {
    res.status(200).send("OK");
})

app.get('/healthz', async (_, res) => {
    try {
        await dbPool.query('SELECT 1');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("OK");
    } catch (err) {
        console.error("Healthcheck DB failed:", err.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end("Error connecting to Db");
    }
})

app.get('/todos', async (_, res) => {
    var todos = {};

    try {
        const res = await dbPool.query(`SELECT * FROM todos`);

        if (res.rows.length > 0) {
            for (let todo of res.rows) {
                todos[todo?.id] = todo?.description ?? '';
            }
        } else {
            console.log('No todos');
        }

    } catch (e) {
        console.log(e);
        res.status(500).send(e?.errorMessage ? e?.errorMessage : 'Error getting Todos');
    }

    res.send(todos);
})

app.post('/todos', async (req, res) => {
    const { newTodo } = req?.body;

    if (!newTodo) {
        console.log('Todo was not provided');
        res.status(400).send('Please provide a Todo');
        return;
    }

    if (newTodo?.length > 140) {
        console.log('Todo must not exceed 140 characters!');
        res.status(400).send('Todo must not exceed 140 characters!');
        return;
    }

    try {
        await dbPool.query(`INSERT INTO todos(description, done) VALUES($1, false)`, [newTodo]);
        console.log('Todo inserted successfully!');

        if (js) {
            console.log('Sending to NAT...')
            const data = `A todo was created: ${newTodo}`;
            await js.publish("events.job", sc.encode(data));
            console.log('✅ Published to NATS successfully');
        } else {
            console.log('Error sending to NAT...')
        }

        res.send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

app.get('/todos/done', async (req, res) => {
    var todos = {};

    try {
        const res = await dbPool.query(`SELECT * FROM todos WHERE done = true`);

        if (res.rows.length > 0) {
            for (let todo of res.rows) {
                todos[todo?.id] = todo?.description ?? '';
            }
        } else {
            console.log('No todos are done yet');
        }

    } catch (e) {
        console.log(e);
        res.status(500).send(e?.errorMessage ? e?.errorMessage : 'Error getting Todos');
    }

    res.send(todos);
})

app.post('/todos/done/:id', async (req, res) => {
    const id = req?.params?.id;

    try {
        const result = await dbPool.query(`UPDATE todos SET done = true WHERE id = $1 RETURNING description`, [id]);
        if (result.rowCount > 0 && js && sc) {
            console.log('Sending to NAT...')
            const data = `A todo was marked as done: ${result.rows[0]?.description}`;
            await js.publish("events.job", sc.encode(data));
            console.log('✅ Published to NATS successfully');
        } else {
            console.log('Problem with sending to NAT...')
        }

        res.status(200).send("OK");
    } catch (e) {
        console.error(e);
        return res.status(500).send(e?.message || 'Error marking todo as done');
    }
});

app.listen((port), () => {
    console.log(`Server started in port ${port}`)
});