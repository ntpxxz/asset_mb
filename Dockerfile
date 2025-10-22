# === Install dependencies
FROM node:20-bullseye AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# === Build app
FROM node:20-bullseye AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# === Run production server
FROM node:20-bullseye AS runner
WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# --- นี่คือส่วนที่แก้ไข ---
# 1. คัดลอกโฟลเดอร์ public จาก stage builder
COPY --from=builder /app/public ./public

# 2. สร้างโฟลเดอร์ uploads 
RUN mkdir -p /app/public/uploads
# --- สิ้นสุดส่วนที่แก้ไข ---

# Create non-root user for security
RUN groupadd --gid 1001 nodejs
RUN useradd --uid 1001 --gid nodejs nextjs

# 3. เปลี่ยนเจ้าของทั้งหมดทีเดียว (คำสั่งนี้จะครอบคลุม /app/public/uploads ที่เพิ่งสร้างด้วย)
RUN chown -R nextjs:nodejs /app

# 4. ลบบรรทัด chown ที่คุณเพิ่มมา เพราะไม่จำเป็นแล้ว
# RUN chown -R nextjs:nextjs /app/public/uploads <-- ลบบรรทัดนี้ทิ้ง

USER nextjs

EXPOSE 3092
CMD ["npm", "start"]