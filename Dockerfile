# Gunakan image resmi Node.js
FROM node:20-slim

# Set direktori kerja
WORKDIR /app

# Salin file package.json dan install dependensi
COPY package*.json ./
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set env agar Puppeteer tidak mencoba download Chromium sendiri
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install dependencies dari package.json
RUN npm install

# Salin semua file ke image
COPY . .

# Jalankan file Node.js kamu
CMD ["node", "check-cituro.js"]
