import { Pool } from 'pg';

// Tell TS that we keep a Pool on globalThis during dev/HMR
declare global {
  // eslint-disable-next-line no-var
  var dbPool: Pool | undefined;
}

function createPool() {
  const isProd = process.env.NODE_ENV === 'production';

  return new Pool(
    isProd
      ? {
          connectionString: process.env.POSTGRES_URL,
          ssl: { rejectUnauthorized: false },
        }
      : {
          user: process.env.POSTGRES_USER ?? 'rootpg',
          host: process.env.POSTGRES_HOST ?? '127.0.0.1',
          database: process.env.POSTGRES_DB ?? 'asset_management',
          password: process.env.POSTGRES_PASSWORD ?? '123456',
          port: Number(process.env.POSTGRES_PORT ?? 5432),
        }
  );
}

// Reuse the same pool in dev to avoid too many connections
const pool = global.dbPool ?? createPool();
if (!global.dbPool) global.dbPool = pool;

export default pool;
