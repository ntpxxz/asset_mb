import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var dbPool: Pool | undefined;
}

function boolEnv(name: string, def = false) {
  const v = (process.env[name] || '').toLowerCase();
  if (['1','true','yes','on'].includes(v)) return true;
  if (['0','false','no','off'].includes(v)) return false;
  return def;
}

function createPool() {
  const useSSL = boolEnv('POSTGRES_SSL', false);

  // 1) ถ้ามี DATABASE_URL ให้ใช้ก่อนเสมอ และให้ SSL อิงตาม POSTGRES_SSL
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: Number(process.env.PGPOOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.PGPOOL_IDLE ?? 30000),
      connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECT_TIMEOUT ?? 10000),
    });
  }

  // 2) ไม่มี DATABASE_URL → ใช้ราย field
  //    ค่าเริ่มต้น host:
  //    - ใช้ POSTGRES_HOST ถ้ามี (แนะนำให้ตั้งใน Docker เป็น 'postgres')
  //    - ถ้าไม่ตั้ง จะ fallback เป็น 'host.docker.internal' (ตรงกับเคสที่คุณบอกว่าใช้ได้)
  const host = process.env.POSTGRES_HOST ?? 'postgres'; // 'host.docker.internal';

  const isProd = process.env.NODE_ENV === 'production';

  return new Pool({
    user: process.env.POSTGRES_USER ?? 'rootpg',
    host: host, // ตั้งเองผ่าน env เมื่ออยู่ใน docker network เดียวกับ DB: POSTGRES_HOST=postgres
    database: process.env.POSTGRES_DB ?? 'asset_management',
    password: process.env.POSTGRES_PASSWORD ?? '123456',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PGPOOL_MAX ?? (isProd ? 20 : 10)),
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE ?? 30000),
    connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECT_TIMEOUT ?? 10000),
  });
}

// Reuse the same pool in dev/HMR
const pool = global.dbPool ?? createPool();
if (!global.dbPool) global.dbPool = pool;

export default pool;
