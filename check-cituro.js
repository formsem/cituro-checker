const express = require('express');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

const app = express();

const EMAIL = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

async function checkCituro() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://app.cituro.com/booking/bev#step=1", { waitUntil: "networkidle2" });
    await page.click(
      "div.ServiceEntryView.selection-widget-base[id^='service-11ec1f7e7f410328b47ffd8fd0d1405a'] button.add-toggle"
    );
    console.log("Trainer selected");
    await page.waitForTimeout(2000);

    await page.goto("https://app.cituro.com/booking/bev#step=2");
    await page.waitForTimeout(3000);

    const noSlot = await page.$("div.emptysuggestion-container");
    if (noSlot) {
      console.log("No new appointment");
      await browser.close();
      return false;
    }

    const events = await page.$$eval("button.GroupEventSuggestionWidget", els =>
      els.map(el => el.innerText.replace(/\n/g, " | "))
    );

    if (events.length > 0) {
      console.log("New appointments found:");
      events.forEach((e, i) => console.log(`${i + 1}. ${e}`));
      await sendEmail(events);
      await browser.close();
      return true;
    } else {
      console.log("No bookable appointments");
      await browser.close();
      return false;
    }
  } catch (err) {
    console.error("Error:", err.message);
    await browser.close();
    return false;
  }
}

async function sendEmail(events) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL, pass: EMAIL_PASSWORD },
  });

  const body = events.map((e, i) => `${i + 1}. ${e}`).join('\n');

  let info = await transporter.sendMail({
    from: EMAIL,
    to: EMAIL,
    subject: "Cituro Appointment Available",
    text: `New appointments:\n\n${body}`,
  });

  console.log("Email sent:", info.messageId);
}

app.get('/', async (req, res) => {
  const result = await checkCituro();
  res.send(result ? "Appointment found and email sent." : "No appointments found.");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
