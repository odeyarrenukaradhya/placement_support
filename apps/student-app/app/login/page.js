'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function StudentLoginPage() {
  const router = useRouter();

  // STEP 1: credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // STEP 2: otp
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ===========================
     STEP 1: EMAIL + PASSWORD
  =========================== */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      if (res.status !== 'OTP_REQUIRED') {
        throw new Error('OTP not initiated');
      }

      // OTP session started
      setOtpId(res.otpId);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     STEP 2: OTP VERIFICATION
  =========================== */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otpId, otp }),
      });

      if (res.user.role !== 'student') {
        throw new Error('Access denied');
      }

      // Store session
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      document.cookie = `token=${res.token}; path=/; max-age=86400; SameSite=Lax`;

      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Student Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Placement Guidance Platform
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!otpId ? (
          /* ===========================
             EMAIL + PASSWORD FORM
          =========================== */
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 py-2 text-white font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Sending OTP…' : 'Sign in'}
            </button>
          </form>
        ) : (
          /* ===========================
             OTP FORM
          =========================== */
          <form className="space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <input
                type="text"
                required
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="block w-full rounded-md border px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-green-600 py-2 text-white font-semibold hover:bg-green-500 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/signup"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
