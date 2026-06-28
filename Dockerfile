FROM node:20-alpine

# Pasang tzdata untuk sinkronisasi waktu & build tools untuk native modules
RUN apk add --no-cache tzdata python3 make g++

# Set zona waktu ke Asia/Jakarta agar log waktu sesuai
ENV TZ=Asia/Jakarta

WORKDIR /app

# Salin berkas package backend
COPY package*.json ./

# Pasang dependensi backend
RUN npm install

# Salin berkas package frontend (layer caching terpisah)
COPY web_app/package*.json ./web_app/

# Pasang dependensi frontend
WORKDIR /app/web_app
RUN npm install

# Kembali ke root, salin semua berkas proyek
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/web_app
RUN npm run build
WORKDIR /app

CMD ["node", "index.js"]
