#!/bin/bash

echo "Menjalankan pengecekan Cituro..."
npx puppeteer browsers install chrome
npx puppeteer install chromium
node check-cituro.js
