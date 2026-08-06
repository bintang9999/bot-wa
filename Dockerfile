FROM node:20-slim

# Set zona waktu ke Asia/Jakarta agar log waktu sesuai
ENV TZ=Asia/Jakarta

WORKDIR /app

# Salin berkas package bot
COPY package*.json ./

# Pasang dependensi build untuk modul native seperti better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Pasang dependensi bot
# Menggunakan node-slim masih membutuhkan tools build di arsitektur tertentu (seperti arm64)
RUN npm install

# Salin semua berkas proyek bot
COPY . .

# Build frontend web app
RUN cd web_app && npm install && npm run build

CMD ["node", "index.js"]
