# Use official Node.js image as the base image
FROM node:16

# Install required dependencies: ffmpeg, Python, Chromium (for Puppeteer), and pip
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3-pip \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    chromium \
    && pip3 install yt-dlp -U \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable to tell Puppeteer where to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set the working directory in the container
WORKDIR /app

# Copy all the application files into the container
COPY . .

# Install the Node.js dependencies
RUN npm install

# Expose the port the app will run on
EXPOSE 3000

# Start the Node.js application
CMD ["npm", "start"]
