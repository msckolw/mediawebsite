FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files from the backend subdirectory
COPY backend/package*.json ./

RUN npm ci --only=production

# Copy backend source code
COPY backend/src ./src

# Cloud Run sets PORT automatically (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD [ "npm", "start" ]
