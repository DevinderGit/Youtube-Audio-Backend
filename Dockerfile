# Use official Node.js image as the base image
FROM node:16

# Install yt-dlp and ffmpeg via pip and apt respectively
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3-pip \
    && pip3 install yt-dlp -U \
    && rm -rf /var/lib/apt/lists/*

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
