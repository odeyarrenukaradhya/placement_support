import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  max: 20
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text: string, params?: any[], retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(text, params);
    } catch (err: any) {
      console.log(`[DB] Query attempt ${i + 1} failed:`, err.message);
      
      const isRetryable = 
        err.message.toLowerCase().includes('timeout') || 
        err.code === 'ECONNRESET' || 
        err.message.toLowerCase().includes('connection terminated') ||
        err.message.toLowerCase().includes('unexpectedly');
        
      if (i === retries - 1 || !isRetryable) {
        throw err;
      }
      
      console.warn(`[DB] Retrying (${i + 1}/${retries})...`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export default pool;
