const express = require('express');
const { PORT } = process.env;
const port = PORT ?? 4000;

var app = express();

app.listen((port), () => {
    console.log(`Server started in port ${port}`)
});