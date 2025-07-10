import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

// Konfigurasi Email
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS || 'jo.enr.kus@gmail.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'hzpe dobn kkva bsic';

// Fungsi delay
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi untuk mengirim notifikasi email
async function sendNotification(eventList, serviceName) {
  if (!EMAIL_ADDRESS || !EMAIL_PASSWORD) {
    console.error('Email credentials tidak ditemukan!');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: EMAIL_ADDRESS,
    to: EMAIL_ADDRESS,
    subject: `Cituro: Jadwal ${serviceName} Tersedia!`,
    text: `Jadwal tersedia untuk ${serviceName}:\n\n${eventList.join('\n')}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email notifikasi terkirim!');
  } catch (err) {
    console.error('Gagal mengirim email:', err.message);
  }
}

// Fungsi untuk memeriksa ketersediaan jadwal
async function checkAvailability(page) {
  try {
    await page.waitForSelector('div.emptysuggestion-container, button.GroupEventSuggestionWidget', {
      timeout: 10000
    });

    const events = await page.$$('button.GroupEventSuggestionWidget');
    if (events.length === 0) {
      console.log('Tidak ada jadwal tersedia');
      return null;
    }

    const messages = await Promise.all(
      events.map(async (event, i) => {
        const text = await event.evaluate(el => el.innerText.replace(/\n/g, ' | '));
        return `${i + 1}. ${text}`;
      })
    );

    console.log(`Ditemukan ${messages.length} jadwal tersedia`);
    return messages;
  } catch (error) {
    console.log('Tidak menemukan elemen ketersediaan');
    return null;
  }
}

// Fungsi untuk memeriksa layanan tertentu
async function checkService(service) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    console.log(`Memulai pengecekan untuk ${service.name}`);

    // Step 1: Pilih layanan
    await page.goto('https://app.cituro.com/booking/bev#step=1', {
      waitUntil: 'networkidle0'
    });
    
    await page.waitForSelector(`div.ServiceEntryView.selection-widget-base[id^='${service.id}']`);
    await page.click(`div.ServiceEntryView.selection-widget-base[id^='${service.id}'] button.add-toggle`);
    await delay(1500);

    // Step 2: Cek ketersediaan
    await page.goto('https://app.cituro.com/booking/bev#step=2', {
      waitUntil: 'networkidle0'
    });
    await delay(2000);

    const result = await checkAvailability(page);
    if (result) {
      await sendNotification(result, service.name);
    }

    return result;
  } catch (error) {
    console.error(`Error saat memproses ${service.name}:`, error.message);
    await page.screenshot({ path: `error-${service.name}.png` });
    return null;
  } finally {
    await browser.close();
    console.log(`Browser ditutup setelah pengecekan ${service.name}`);
    await delay(2000); // Jeda antar service
  }
}

// Fungsi utama
async function main() {
  const services = [
    {
      id: 'service-11ec1f7e7f410328b47ffd8fd0d1405a',
      name: 'Trainerliste'
    },
    {
      id: 'service-11ec1f7caa3ccd81b47ffd8fd0d1405a',
      name: 'PHS'
    },
    {
      id: 'service-11ec6beb2eaa9338aa8a439675a3b52a',
      name: 'Zeiten nur für Wettbewerbsläufer der aktuellen Saison (national/internat. Wettbewerbe)'
    },
    {
      id: 'service-11ec30eafabb930a985185ea705469d2',
      name: 'Sportforum Halle 2 (Trainingshalle mit Glasfront)'
    }
  ];

  try {
    for (const service of services) {
      await checkService(service);
    }
  } catch (error) {
    console.error('Error utama:', error.message);
  } finally {
    console.log('Proses pengecekan selesai');
  }
}

// Jalankan script
(async () => {
  await main();
})();
