# ==========================================
# STAGE 1: Build React App (Menggunakan Node)
# ==========================================
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json dan install dependency
COPY package.json package-lock.json ./
RUN npm install

# Copy seluruh source code
COPY . .

# Build aplikasi untuk production
# Catatan: Pastikan perintah ini sesuai (npm run build)
RUN npm run build

# ==========================================
# STAGE 2: Sajikan dengan Nginx
# ==========================================
FROM nginx:alpine

# Copy hasil build dari Stage 1 ke folder Nginx
# UBAH KATA 'dist' MENJADI 'build' JIKA KAMU MEMAKAI CREATE REACT APP (CRA)
COPY --from=builder /app/build /usr/share/nginx/html

# Copy file konfigurasi Nginx yang kita buat di Langkah 2
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Buka port 80 di dalam container
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]