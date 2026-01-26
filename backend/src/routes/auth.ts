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

export default router;
