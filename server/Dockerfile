FROM node:20-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies (only production if building for production, but node-gyp etc might be needed. Safe install:)
RUN npm ci --only=production

# Copy server code
COPY . .

# Expose API port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Run start script
CMD ["npm", "start"]
