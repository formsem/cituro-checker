const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});


async function checkAppointments() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  try {
    await page.goto('https://app.cituro.com/booking/bev#step=1', { waitUntil: 'networkidle0' });
    await page.click("div.ServiceEntryView.selection-widget-base[id^='service-11ec1f7e7f410328b47ffd8fd0d1405a'] button.add-toggle");
    await page.waitForTimeout(2000);

    await page.goto('https://app.cituro.com/booking/bev#step=2', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);

    const emptyList = await page.$('div.emptysuggestion-container');
    if (emptyList) {
      console.log(`[${new Date().toISOString()}] Tidak ada jadwal.`);
    } else {
      const events = await page.$$('button.GroupEventSuggestionWidget');
      if (events.length > 0) {
        console.log(`[${new Date().toISOString()}] Ada ${events.length} jadwal!`);
        const messages = [];
        for (let i = 0; i < events.length; i++) {
          const text = await events[i].evaluate(el => el.innerText.replace(/\n/g, ' | '));
          messages.push(`${i + 1}. ${text}`);
        }
        await sendNotification(messages);
      } else {
        console.log(`[${new Date().toISOString()}] Tidak ada jadwal yang bisa dipesan.`);
      }
    }
  } catch (e) {
    console.error('Gagal mengecek:', e.message);
  } finally {
    await browser.close();
  }
}

async function sendNotification(eventList) {
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

checkAppointments();
