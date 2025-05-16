const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/publish', async (req, res) => {
  const { title, content } = req.body;

  try {
    const browser = await puppeteer.launch({ headless: false }); // İlk başta false
    const page = await browser.newPage();

    // 👉 Cookie'yi burada ekliyoruz
    const cookieString = process.env.MEDIUM_COOKIE;
    const cookies = cookieString.split(';').map(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      const value = rest.join('=');
      return {
        name,
        value,
        domain: '.medium.com',
        path: '/',
      };
    });

    await page.setCookie(...cookies);

    // Artık giriş sayfasına değil, direkt yeni yazı sayfasına git
    await page.goto('https://medium.com/new-story', { waitUntil: 'networkidle2' });

    await page.keyboard.type(title);
    await page.keyboard.press('Enter');
    await page.keyboard.type(content);

    console.log("✅ Yazı yazıldı. Yayınlama için manuel onay gerekebilir.");

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hata oluştu.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`));
