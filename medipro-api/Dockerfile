FROM node:20-alpine

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose port (default 3000 as per common express apps, need to check server.ts)
EXPOSE 4000

# Copy start script
COPY start.sh .
RUN chmod +x start.sh

# Start command
CMD ["./start.sh"]
