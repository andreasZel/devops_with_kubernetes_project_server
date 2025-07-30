const express = require('express');
const path = require('path');
const fs = require('node:fs/promises');

const { PORT } = process.env;
const port = PORT ?? 4004;
const todosDir = path.join(__dirname, 'todos');
const outputPath = path.join(todosDir, 'todos.json');

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