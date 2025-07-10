#!/bin/bash

echo "Menjalankan pengecekan Cituro..."
npm puppeteer browsers install chrome
npm puppeteer install chromium
npm update puppeteer nodemailer
node check-cituro.js
