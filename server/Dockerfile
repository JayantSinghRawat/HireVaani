FROM node:20-slim

WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

RUN npm install

# Copy all files
COPY . .

# Environment variables
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
