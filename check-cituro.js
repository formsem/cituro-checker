const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

const EMAIL = "jo.enr.kus@gmail.com";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD; // simpan di Railway Secret

async function checkCituro() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    // Step 1: Pilih Trainer
    await page.goto("https://app.cituro.com/booking/bev#step=1", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector(
      "div.ServiceEntryView.selection-widget-base[id^='service-11ec1f7e7f410328b47ffd8fd0d1405a'] button.add-toggle",
      { timeout: 10000 }
    );
    await page.click(
      "div.ServiceEntryView.selection-widget-base[id^='service-11ec1f7e7f410328b47ffd8fd0d1405a'] button.add-toggle"
    );

    console.log("✅ Trainer ausgewählt");
    await page.waitForTimeout(2000);

    // Step 2: Cek Appointment
    await page.goto("https://app.cituro.com/booking/bev#step=2");
    await page.waitForTimeout(3000);

    const kosong = await page.$("div.emptysuggestion-container");
    if (kosong) {
      console.log("⛔ Tidak ada appointment baru");
      await browser.close();
      return;
    }

    const eventButtons = await page.$$("button.GroupEventSuggestionWidget");

    if (eventButtons.length > 0) {
      console.log("✅ Ditemukan appointment baru:");
      const eventList = [];

      for (let i = 0; i < eventButtons.length; i++) {
        const text = await eventButtons[i].evaluate((el) => el.innerText);
        console.log(`- ${text}`);
        eventList.push(text);
      }

      await sendEmail(eventList);
    } else {
      console.log("⛔ Tidak ada appointment yang bisa dibooking");
    }
  } catch (e) {
    console.error("❌ ERROR:", e.message);
  } finally {
    await browser.close();
  }
}

async function sendEmail(events) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: EMAIL_PASSWORD,
    },
  });

  const content = events.map((e, i) => `${i + 1}. ${e.replace("\n", " | ")}`).join("\n");

  const mailOptions = {
    from: EMAIL,
    to: EMAIL,
    subject: "Trainer verfügbar auf Cituro",
    text: `Termine:\n\n${content}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 Email dikirim!");
  } catch (err) {
    console.error("❌ Gagal kirim email:", err.message);
  }
}

checkCituro();
