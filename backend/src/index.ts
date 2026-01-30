import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import authRouter from './routes/auth';
import examsRouter from './routes/exams';
import tintRouter from './routes/tint';
import attemptsRouter from './routes/attempts';
import integrityRouter from './routes/integrity';
import collegesRouter from './routes/colleges';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';
import profileRouter from './routes/profile';
import { startOTPCleanupScheduler } from './utils/otpCleanup';

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/exams', examsRouter);
app.use('/tint', tintRouter);
app.use('/attempts', attemptsRouter);
app.use('/integrity', integrityRouter);
app.use('/colleges', collegesRouter);
app.use('/admin', adminRouter);
app.use('/analytics', analyticsRouter);
app.use('/profile', profileRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Start OTP cleanup scheduler
  startOTPCleanupScheduler();
});
