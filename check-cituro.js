import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAppointments() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // Step 1: Pilih layanan
    await page.goto('https://app.cituro.com/booking/bev#step=1', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    await page.click("div.ServiceEntryView.selection-widget-base[id^='service-'] button.add-toggle");
    await delay(2000); // Ganti waitForTimeout

    // Step 2: Cek ketersediaan
    await page.goto('https://app.cituro.com/booking/bev#step=2', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    await delay(3000); // Ganti waitForTimeout

    // Deteksi ketersediaan
    const emptyList = await page.$('div.emptysuggestion-container');
    const events = await page.$$('button.GroupEventSuggestionWidget');

    if (emptyList || events.length === 0) {
      console.log(`[${new Date().toISOString()}] Tidak ada jadwal.`);
    } else {
      console.log(`[${new Date().toISOString()}] Ada ${events.length} jadwal!`);
      
      const messages = await Promise.all(
        events.map(async (event, i) => {
          const text = await event.evaluate(el => el.innerText.replace(/\n/g, ' | '));
          return `${i + 1}. ${text}`;
        })
      );
      
      await sendNotification(messages);
    }
  } catch (e) {
    console.error('Gagal mengecek:', e.message);
    await page.screenshot({ path: 'error.png' });
    console.log('Screenshot disimpan sebagai error.png');
  } finally {
    await browser.close();
  }
}

async function sendNotification(eventList) {
  if (!EMAIL_ADDRESS || !EMAIL_PASSWORD) {
    console.error('Email credentials tidak ditemukan!');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: EMAIL_ADDRESS,
    to: EMAIL_ADDRESS,
    subject: 'Cituro: Ada jadwal baru!',
    text: `Berikut jadwal yang tersedia:\n\n${eventList.join('\n')}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email berhasil dikirim!');
  } catch (err) {
    console.error('Gagal kirim email:', err.message);
  }
}

(async () => {
  await checkAppointments();
})();
