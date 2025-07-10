#!/bin/bash

echo "Menjalankan pengecekan Cituro..."
npx puppeteer browsers install chrome
node check-cituro.js
