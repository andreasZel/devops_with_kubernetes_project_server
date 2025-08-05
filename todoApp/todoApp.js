const express = require('express');
const path = require('path');
const fs = require('node:fs/promises');

const {
    PORT,
    TODOS_DIR_REL,
    TODOS_FILENAME,
} = process.env;

const missingEnvVars = [];
if (!PORT) missingEnvVars.push('PORT');
if (!TODOS_DIR_REL) missingEnvVars.push('TODOS_DIR_REL');
if (!TODOS_FILENAME) missingEnvVars.push('TODOS_FILENAME');

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const port = Number(PORT);

const todosDir = path.join(__dirname, TODOS_DIR_REL);
const outputPath = path.join(todosDir, TODOS_FILENAME);

var app = express();

app.use(express.json());

app.get('/todos', async (_, res) => {
    var todos = {};

    try {
        const res = await fs.readFile(outputPath, 'utf8');
        todos = await JSON.parse(res);
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
        var todos = {};

        try {
            const res = await fs.readFile(outputPath, 'utf8');
            todos = await JSON.parse(res);
        } catch (e) {
            console.log(e)
        }

        const keysLength = Object.keys(todos)?.length;

        todos[keysLength + 1] = newTodo;

        const todosToWrite = JSON.stringify(todos);
        await fs.writeFile(outputPath, todosToWrite);

        res.send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

app.listen((port), () => {
    console.log(`Server started in port ${port}`)
});