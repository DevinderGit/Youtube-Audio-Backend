const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();

app.use(cors());

app.get('/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const ytDlp = spawn('yt-dlp', [
            '-f', 'best[height<=360]', // Simplified format
            '-o', '-', // Output to stdout
            videoUrl
        ]);

        res.setHeader('Content-Type', 'video/mp4');
        ytDlp.stdout.pipe(res);

        ytDlp.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });

        ytDlp.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp process exited with code ${code}`);
                res.end();
            }
        });

    } catch (err) {
        console.error('Streaming error:', err);
        res.status(500).send('Error streaming video');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});