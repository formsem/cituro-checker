#!/bin/bash

echo "Menjalankan pengecekan Cituro..."
npm puppeteer browsers install chrome
npm puppeteer install chromium
node check-cituro.js
