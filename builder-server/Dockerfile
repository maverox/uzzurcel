# Use an existing docker image as a base
FROM ubuntu:focal

# Set the working directory
WORKDIR /home/app

# Update and install dependencies in a single layer to reduce image size
RUN apt-get update && \
    apt-get install -y curl git && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy package*.json first for better cache on Docker build
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy the rest of the application
COPY main.sh script.js ./

# Make sure main.sh and script.js are executable
RUN chmod +x main.sh script.js

# Run the main.sh when the container launches
ENTRYPOINT [ "/home/app/main.sh" ]