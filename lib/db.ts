import { Pool } from 'pg';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  if (!global.dbPool) {
    global.dbPool = new Pool({
      user: process.env.POSTGRES_USER || 'user',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'asset_management',
      password: process.env.POSTGRES_PASSWORD || 'password',
      port: 5432,
    });
  }
  pool = global.dbPool;
}

export default pool;
