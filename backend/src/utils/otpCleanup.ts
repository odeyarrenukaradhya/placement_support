import { query } from '../db';

/**
 * Cleanup expired and used OTPs from the database
 * Deletes OTPs that are either:
 * 1. Expired (expires_at < current time)
 * 2. Used and older than 24 hours
 * 3. Older than 24 hours regardless of status
 */
export async function cleanupExpiredOTPs() {
  try {
    const result = await query(
      `DELETE FROM login_otps 
       WHERE expires_at < NOW() 
       OR (used = true AND created_at < NOW() - INTERVAL '24 hours')
       OR created_at < NOW() - INTERVAL '24 hours'
       RETURNING id`
    );
    
    const deletedCount = result.rowCount || 0;
    console.log(`[OTP Cleanup] Deleted ${deletedCount} expired/old OTP records at ${new Date().toISOString()}`);
    
    return deletedCount;
  } catch (err) {
    console.error('[OTP Cleanup] Error cleaning up OTPs:', err);
    throw err;
  }
}

/**
 * Start the OTP cleanup scheduler
 * Runs cleanup every 12 hours
 */
export function startOTPCleanupScheduler() {
  // Run immediately on startup
  cleanupExpiredOTPs().catch(err => 
    console.error('[OTP Cleanup] Initial cleanup failed:', err)
  );
  
  // Then run every 12 hours (12 * 60 * 60 * 1000 ms)
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  
  setInterval(() => {
    cleanupExpiredOTPs().catch(err => 
      console.error('[OTP Cleanup] Scheduled cleanup failed:', err)
    );
  }, TWELVE_HOURS);
  
  console.log('[OTP Cleanup] Scheduler started - will run every 12 hours');
}
