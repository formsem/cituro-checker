FROM node:20-bullseye

# Install Chrome Latest
RUN apt-get update && \
    apt-get install -y wget && \
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt install -y ./google-chrome-stable_current_amd64.deb && \
    rm google-chrome-stable_current_amd64.deb

# Verifikasi
RUN ls -la /usr/bin/google-chrome* && \
    google-chrome --version && \
    which google-chrome

ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "check-cituro.js"]
