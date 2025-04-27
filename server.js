
const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const app = express();

app.use(cors());

app.get('/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'lowest',
            filter: format => format.hasVideo && format.hasAudio, // Ensure both video and audio
        });
        
        const stream = ytdl(videoUrl, {
            format: format, // Use the selected format
            highWaterMark: 1 << 25, // 32 MB buffer
        });
        
        res.setHeader('Content-Type', 'video/mp4');
        stream.pipe(res);

    } catch (err) {
        console.error('Streaming error:', err);
        res.status(500).send('Error streaming video');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
