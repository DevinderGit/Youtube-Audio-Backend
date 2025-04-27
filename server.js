const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const app = express();
app.use(cors());

let globalCookies = ''; // Will store the cookies globally

async function getCookiesFromBrowserless(url) {
    const browser = await puppeteer.connect({
        browserWSEndpoint: 'wss://chrome.browserless.io?token=SCw0dcFKK12OpT8e4ba85d43ea18b6ada65a991ea3',
        defaultViewport: null,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const cookies = await page.cookies();
    await browser.close();

    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    return cookieString;
}

// Function to refresh cookies every 6 hours (optional but smart)
async function refreshCookies() {
    console.log('Refreshing cookies...');
    try {
        globalCookies = await getCookiesFromBrowserless('https://www.youtube.com');
        console.log('Cookies refreshed!');
    } catch (err) {
        console.error('Failed to refresh cookies:', err);
    }
}

// Immediately get cookies when server starts
refreshCookies();

// Refresh cookies every 6 hours
setInterval(refreshCookies, 6 * 60 * 60 * 1000);

app.get('/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    if (!globalCookies) {
        return res.status(503).send('Cookies not ready yet, please try again shortly.');
    }

    try {
        const ytDlp = spawn('yt-dlp', [
            '--add-header', `cookie: ${globalCookies}`,
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            '-f', 'best[height<=360]',
            '-o', '-', 
            videoUrl
        ]);

        res.setHeader('Content-Type', 'video/mp4');
        ytDlp.stdout.pipe(res);

        ytDlp.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });

        ytDlp.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp exited with code ${code}`);
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
    console.log(`Server running on port ${PORT}`);
});
