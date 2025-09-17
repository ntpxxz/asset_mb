import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getBaseUrl(): string {
  // ฝั่ง browser → ใช้ origin ของหน้าปัจจุบัน
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // ฝั่ง server: ให้ INTERNAL_APP_URL มาก่อนเสมอ (ชี้พอร์ตในคอนเทนเนอร์)
  const serverBase =
    process.env.INTERNAL_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||             // เผื่อ dev นอก docker
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (serverBase) return serverBase.replace(/\/$/, '');

  // fallback สุดท้าย
  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}`;
}
