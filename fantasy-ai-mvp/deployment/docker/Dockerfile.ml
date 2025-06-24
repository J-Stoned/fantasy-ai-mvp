# ML Training Docker Image
FROM node:18-alpine

WORKDIR /app

# Install Python for TensorFlow
RUN apk add --no-cache python3 py3-pip

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production
RUN npx prisma generate

# Copy application code
COPY src ./src
COPY scripts ./scripts
COPY tsconfig.json ./

# Set environment
ENV NODE_ENV=production
ENV SKIP_MCP_INIT=false

# Run ML engine
CMD ["npx", "tsx", "scripts/ML-CONTINUOUS-LEARNING-ENGINE.ts"]