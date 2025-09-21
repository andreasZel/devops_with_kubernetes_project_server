const express = require('express');
const path = require('path');
const fs = require('node:fs/promises');

const {
    PORT,
    STATIC_DIR_REL,
    IMAGE_SOURCE_URL,
    TEN_MINUTES,
    IMAGE_DIR_REL,
    OUTPUT_IMAGE_FILENAME,
    CACHED_TIME_FILENAME,
} = process.env;

const missingEnvVars = [];
if (!PORT) missingEnvVars.push('PORT');
if (!STATIC_DIR_REL) missingEnvVars.push('STATIC_DIR_REL');
if (!TEN_MINUTES) missingEnvVars.push('TEN_MINUTES');
if (!IMAGE_SOURCE_URL) missingEnvVars.push('IMAGE_SOURCE_URL');
if (!IMAGE_DIR_REL) missingEnvVars.push('IMAGE_DIR_REL');
if (!OUTPUT_IMAGE_FILENAME) missingEnvVars.push('OUTPUT_IMAGE_FILENAME');
if (!CACHED_TIME_FILENAME) missingEnvVars.push('CACHED_TIME_FILENAME');

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const port = Number(PORT);
const timeoutMs = Number(TEN_MINUTES);

const publicDir = path.join(__dirname, IMAGE_DIR_REL);
const outputPath = path.join(publicDir, OUTPUT_IMAGE_FILENAME);
const cachedTimePath = path.join(publicDir, CACHED_TIME_FILENAME);

async function saveImage(currentTime) {
    const response = await fetch(IMAGE_SOURCE_URL);
    const buffer = await response.arrayBuffer();

    fs.writeFile(outputPath, Buffer.from(buffer));
    fs.writeFile(cachedTimePath, currentTime.toISOString());
}

var app = express();

app.use(express.static(path.join(__dirname, STATIC_DIR_REL)));

app.get('/healthz', (req, res) => res.status(200).send("OK"));

// app.get('/', (req, res, next) => {
 
//   if (req.get('User-Agent')?.includes('kube-probe')) {
//     return res.status(200).send("OK");
//   }
  
//   next(); 
// });

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
            if ((currentTime.getTime() - time) > timeoutMs) {
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