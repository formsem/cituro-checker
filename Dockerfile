# Gunakan base image Node.js 18 dengan Alpine (ringan)
FROM node:18-alpine

# Install Chromium dan dependencies yang diperlukan Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && echo "Chromium version:" $(chromium-browser --version)

# Set environment variable untuk Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Buat direktori kerja
WORKDIR /app

# Copy package.json terlebih dahulu untuk caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy semua file project
COPY . .

# Jalankan aplikasi
CMD ["npm", "start"]
