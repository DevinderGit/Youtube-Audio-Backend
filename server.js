const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer'); // Add puppeteer
const app = express();

app.use(cors());

async function getCookiesFromPuppeteer(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const cookies = await page.cookies();

    await browser.close();

    // Format cookies for yt-dlp
    const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    return cookieString;
}

app.get('/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const cookieHeader = await getCookiesFromPuppeteer(videoUrl);

        const ytDlp = spawn('yt-dlp', [
            '--add-header', `Cookie: ${cookieHeader}`,
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            '-f', 'best[height<=360]',         // Your format selection
            '-o', '-',                         // Output to stdout
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
