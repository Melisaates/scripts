const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/publish', async (req, res) => {
  const { title, content, coverImage } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Medium çerezlerini ayarla (env dosyasındaki MEDIUM_COOKIE)
    const cookieString = process.env.MEDIUM_COOKIE;
    if (!cookieString) throw new Error('MEDIUM_COOKIE environment variable is missing!');
    
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

    // Medium yeni yazı sayfasına git
    await page.goto('https://medium.com/new-story', { waitUntil: 'networkidle2' });

    // Sayfanın tamamen yüklendiğini kontrol et
    await page.waitForSelector('div[contenteditable="true"]');

    // 🖼️ Kapak resmi varsa önce ekleyelim
    if (coverImage) {
      // Medium yeni arayüzünde kapak resmi eklemek için:
      // "Add a cover image" butonunu bul ve tıkla
      // Alternatif: doğrudan kapak alanına URL ekleme mümkün değil, Puppeteer ile upload yapılması gerekebilir
      // Ama hızlıca DOM içine görsel ekleme yapabiliriz (sadece görsel görünür olur, Medium bunu kapak olarak kabul etmeyebilir)

      await page.evaluate((imageUrl) => {
        const target = document.querySelector('section div div div div div div div div'); // çok derin, Medium'da değişiklik olabilir
        if (target) {
          const img = document.createElement('img');
          img.src = imageUrl;
          img.style.maxWidth = '100%';
          img.style.marginBottom = '20px';
          target.prepend(img);
        }
      }, coverImage);

      // Görselin yüklenmesi için ufak bekleme
      // await page.waitForTimeout(1500);  // eski sürümde çalışmaz
await new Promise(resolve => setTimeout(resolve, 1500));  // bunun yerine kullan

    }

    // 📝 Başlığı yaz
    await page.keyboard.type(title);

    // Enter ile başlık sonu
    await page.keyboard.press('Enter');

    // İçeriği yaz
    await page.keyboard.type(content);

    console.log("✅ Yazı yazıldı. Medium otomatik olarak draft kaydedecektir.");

    // İstersen burada yayına almak için ekstra işlemler yapılabilir,
    // ancak Medium otomatik draft modunda bırakabilir.

    // Browser kapatmayabiliriz test için
    // await browser.close();

    res.json({ success: true, message: 'Yazı başarıyla oluşturuldu (draft olarak).' });
  } catch (err) {
    console.error('Hata:', err);
    res.status(500).json({ error: err.message || 'Bilinmeyen hata oluştu.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`));
