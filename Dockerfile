FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates fonts-liberation \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
    libdbus-1-3 libgtk-3-0 libasound2 \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "check-cituro.js"]
