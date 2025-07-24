const express = require('express');
const path = require('path');
const fs = require('node:fs/promises');

const { PORT } = process.env;
const port = PORT ?? 4000;
const publicDir = path.join(__dirname, 'public', 'image');
const outputPath = path.join(publicDir, 'cachedImage.png');
const cachedTimePath = path.join(publicDir, 'time.txt');

const TEN_MINUTES = 10 * 60 * 1000;

async function saveImage(currentTime) {
    const response = await fetch('https://picsum.photos/720');
    const buffer = await response.arrayBuffer();

    fs.writeFile(outputPath, Buffer.from(buffer));
    fs.writeFile(cachedTimePath, currentTime.toISOString());
}

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/getImage', async (_, res) => {
    console.log('Chacking image');

    try {
        var timeText = null;

        try {
            timeText = await fs.readFile(cachedTimePath, 'utf8');
        } catch (e) {
            console.log(e)
        }
        const time = timeText != '' && !!timeText ? new Date(timeText).getTime() : false;
        const currentTime = new Date();

        if (time) {
            if ((currentTime.getTime() - time) > TEN_MINUTES) {
                await saveImage(currentTime);
            }
        } else {
            await saveImage(currentTime);
        }

        res.send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
})

app.listen((port), () => {
    console.log(`Server started in port ${port}`)
});