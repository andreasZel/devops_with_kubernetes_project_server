import express from 'express';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const {
    PORT
} = process.env;

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
        description VARCHAR(140)
      )`);

        console.log("✅ Table todos check/creation complete.");
    } catch (err) {
        console.error("❌ Error creating todos:", err);
    }

    return client;
}

const missingEnvVars = [];
if (!PORT) missingEnvVars.push('PORT');

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const port = Number(PORT);
const dbPool = await dbInitAndConnect();

var app = express();

app.use(express.json());

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
        res.status(400).send('Please provide a Todo');
        return;
    }

    try {
        const res = await dbPool.query(`INSERT INTO todos(description) VALUES($1)`, [newTodo]);
        res.send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

app.listen((port), () => {
    console.log(`Server started in port ${port}`)
});