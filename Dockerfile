FROM node:20-slim

# Set zona waktu ke Asia/Jakarta agar log waktu sesuai
ENV TZ=Asia/Jakarta

WORKDIR /app

# Salin berkas package bot
COPY package*.json ./

# Pasang dependensi bot
# Menggunakan node-slim akan mendownload pre-built binary untuk sqlite3 (jauh lebih cepat dari alpine)
RUN npm install

# Salin semua berkas proyek bot
COPY . .

CMD ["node", "index.js"]
