const express = require('express');
const path = require('path');
const { PORT } = process.env;
const port = PORT ?? 4000;

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.listen((port), () => {
    console.log(`Server started in port ${port}`)
});