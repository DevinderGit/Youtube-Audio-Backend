const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();
app.use(cors());


const puppeteer = require('puppeteer-core'); // Use puppeteer-core for remote connections

async function getCookiesFromBrowserless(url) {
    const browser = await puppeteer.connect({
        browserWSEndpoint: 'wss://chrome.browserless.io?token=SCw0dcFKK12OpT8e4ba85d43ea18b6ada65a991ea3', // Replace YOUR_API_KEY with your actual API key
        defaultViewport: null, // Optional, depending on your needs
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const cookies = await page.cookies();

    await browser.close();

    // Format cookies for yt-dlp or other tools
    const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    return cookieString;
}

app.get('/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const cookies = await getCookiesFromBrowserless(videoUrl);
        
        // Use cookies with yt-dlp to download video/audio
        const ytDlp = spawn('yt-dlp', [
            '--cookies', cookies, // Pass the cookies string
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            '-f', 'best[height<=360]', // Your format selection
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
