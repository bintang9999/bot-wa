FROM node:20-alpine

# Pasang tzdata untuk sinkronisasi waktu & perkakas dasar
RUN apk add --no-cache tzdata

# Set zona waktu ke Asia/Jakarta agar log waktu sesuai
ENV TZ=Asia/Jakarta

WORKDIR /app

# Salin berkas package
COPY package*.json ./

# Pasang dependensi
RUN npm install

# Salin semua berkas proyek
COPY . .

# Build frontend
WORKDIR /app/web_app
RUN npm install
RUN npm run build
WORKDIR /app

CMD ["node", "index.js"]
