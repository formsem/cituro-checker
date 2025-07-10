FROM node:18-bullseye-slim

# Install dependencies untuk Chromium
RUN apt-get update && \
    apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

CMD ["node", "check-cituro.js"]
