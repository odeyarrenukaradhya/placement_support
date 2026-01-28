import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { generateOTP, hashOTP } from '../utils/otp';
import { sendOTPEmail } from '../utils/mailer';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/* ===========================
   SIGNUP (STUDENT / TPO ONLY)
=========================== */
router.post('/signup', async (req: any, res: any) => {
  let { name, email, password, role, college_id } = req.body;
  email = email?.trim().toLowerCase();

  if (!['student', 'tpo'].includes(role)) {
    return res.status(403).json({ error: 'Invalid role for signup' });
  }

  try {
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, college_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, college_id`,
      [name, email, hashedPassword, role, college_id || null]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

/* ===========================
   LOGIN (PASSWORD + SECRET + OTP)
=========================== */
router.post('/login', async (req: any, res: any) => {
  let { email, password, secret } = req.body;
  email = email?.trim().toLowerCase();

  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    /* SUPER ADMIN SECRET CHECK */
    if (user.role === 'admin') {
      if (!secret) {
        return res.status(403).json({ error: 'Super admin secret required' });
      }

      const secretMatch = secret === user.admin_secret_hash;

      if (!secretMatch) {
        return res.status(403).json({ error: 'Invalid super admin secret' });
      }
    }

    /* INVALIDATE OLD OTPS */
    await query(
      'UPDATE login_otps SET used = true WHERE user_id = $1',
      [user.id]
    );

    /* CREATE OTP */
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otpResult = await query(
      `INSERT INTO login_otps (user_id, otp_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.id, otpHash, expiresAt]
    );

    // Send OTP asynchronously to improve response time
    sendOTPEmail(user.email, otp).catch(err => console.error('Faled to send OTP:', err));

    return res.json({
      status: 'OTP_REQUIRED',
      otpId: otpResult.rows[0].id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/* ===========================
   VERIFY OTP → ISSUE JWT
=========================== */
router.post('/verify-otp', async (req: any, res: any) => {
  const { otpId, otp } = req.body;

  console.log('Verifying OTP for ID:', otpId);
  try {
    const result = await query(
      'SELECT * FROM login_otps WHERE id = $1',
      [otpId]
    );
    console.log('OTP record found:', result.rows.length > 0);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const record = result.rows[0];

    if (record.used || record.attempts >= 3) {
      return res.status(403).json({ error: 'OTP invalid' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(410).json({ error: 'OTP expired' });
    }

    if (hashOTP(otp) !== record.otp_hash) {
      await query(
        'UPDATE login_otps SET attempts = attempts + 1 WHERE id = $1',
        [otpId]
      );
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    console.log('Updating OTP record as used...');
    await query(
      'UPDATE login_otps SET used = true WHERE id = $1',
      [otpId]
    );

    console.log('Fetching user info for ID:', record.user_id);
    const userResult = await query(
      'SELECT id, name, email, role, college_id FROM users WHERE id = $1',
      [record.user_id]
    );
    console.log('User found:', userResult.rows.length > 0);

    const user = userResult.rows[0];

    // Update last_login_at timestamp
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    console.log('Signing JWT...');
    const token = jwt.sign(
      { id: user.id, role: user.role, college_id: user.college_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('JWT signed successfully');

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

/* ===========================
   SUPER ADMIN: LIST USERS
=========================== */
router.get(
  '/users',
  authenticateJWT,
  authorizeRoles('admin'),
  async (req: any, res: any) => {
    const { role } = req.query;
    try {
      const result = await query(
        'SELECT id, name, email, role, college_id FROM users WHERE role = $1',
        [role]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);


/* ===========================
   PASSWORD RESET FLOW
=========================== */

/* 1. REQUEST RESET (Email -> OTP) */
router.post('/request-password-reset', async (req: any, res: any) => {
  let { email } = req.body;
  email = email?.trim().toLowerCase();

  try {
    const userResult = await query('SELECT id, email, otp_request_attempts, otp_blocked_until FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Return success even if user not found to prevent enumeration
      return res.json({ message: 'If account exists, OTP sent', otpId: 'simulation' });
    }

    const user = userResult.rows[0];

    // Check if user is currently blocked
    if (user.otp_blocked_until && new Date(user.otp_blocked_until) > new Date()) {
      const remainingMs = new Date(user.otp_blocked_until).getTime() - new Date().getTime();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res.status(429).json({ 
        error: `Too many OTP requests. Please try again after ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.` 
      });
    }

    // Check if user has reached the attempt limit
    const currentAttempts = user.otp_request_attempts || 0;
    
    if (currentAttempts >= 2) {
      // This will be the 3rd attempt, so block the user
      const blockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      await query(
        'UPDATE users SET otp_request_attempts = $1, otp_blocked_until = $2 WHERE id = $3',
        [currentAttempts + 1, blockedUntil, user.id]
      );
      
      return res.status(429).json({ 
        error: 'Too many OTP requests. Please try again after 10 minutes.' 
      });
    }

    // Increment attempt counter
    await query(
      'UPDATE users SET otp_request_attempts = otp_request_attempts + 1 WHERE id = $1',
      [user.id]
    );

    // Create OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const otpResult = await query(
      `INSERT INTO login_otps (user_id, otp_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.id, otpHash, expiresAt]
    );

    // Send Email
    // Import dynamically if needed or assume it's available from top-level import
    const { sendPasswordResetEmail } = await import('../utils/mailer');
    sendPasswordResetEmail(user.email, otp).catch(err => console.error('Failed to send reset OTP:', err));

    res.json({ message: 'OTP sent', otpId: otpResult.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 2. VERIFY RESET OTP */
router.post('/verify-reset-otp', async (req: any, res: any) => {
  const { otpId, otp } = req.body;

  try {
    const result = await query('SELECT * FROM login_otps WHERE id = $1', [otpId]);
    
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid OTP' });
    const record = result.rows[0];

    if (record.used) return res.status(400).json({ error: 'OTP already used' });
    if (new Date(record.expires_at) < new Date()) return res.status(410).json({ error: 'OTP expired' });
    
    if (hashOTP(otp) !== record.otp_hash) {
       await query('UPDATE login_otps SET attempts = attempts + 1 WHERE id = $1', [otpId]);
       return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Use a transaction to update both tables atomically and efficiently
    await query('BEGIN');
    try {
      // Mark OTP as used
      await query('UPDATE login_otps SET used = true WHERE id = $1', [otpId]);
      
      // Reset rate limiting after successful verification
      await query(
        'UPDATE users SET otp_request_attempts = 0, otp_blocked_until = NULL WHERE id = $1',
        [record.user_id]
      );
      
      await query('COMMIT');
    } catch (txErr) {
      await query('ROLLBACK');
      throw txErr;
    }

    // Issue short-lived reset token
    const resetToken = jwt.sign(
      { id: record.user_id, purpose: 'reset_password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ message: 'OTP verified', resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 3. RESET PASSWORD */
router.post('/reset-password', async (req: any, res: any) => {
  const { resetToken, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password too short' });
  }

  try {
    const decoded: any = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.purpose !== 'reset_password') {
      return res.status(403).json({ error: 'Invalid token purpose' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, decoded.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
