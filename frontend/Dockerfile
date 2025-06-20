# ---------- STAGE 1: Build ----------
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy only package.json and lock file first for better caching
COPY package*.json ./

# Install dependencies (include optional to avoid native build bugs)
RUN npm install

# Copy all project files
COPY . .

# Build Vite project
RUN npm run build


# ---------- STAGE 2: Serve with Nginx ----------
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend from previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
