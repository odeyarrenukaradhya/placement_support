'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // STEP 1: PASSWORD + SECRET → OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, secret })
      });

      if (res.status !== 'OTP_REQUIRED') {
        throw new Error('OTP not initiated');
      }

      setOtpId(res.otpId);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: OTP → JWT
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otpId, otp })
      });

      console.log('OTP Verification Response:', res);

      if (res.user.role !== 'admin') {
        throw new Error('Access denied');
      }

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      document.cookie = `token=${res.token}; path=/; max-age=86400; SameSite=Lax`;

      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md bg-gray-900 p-10 rounded-xl border border-gray-800">
        <h2 className="text-center text-3xl font-bold text-white">
          Super Admin Access
        </h2>

        {error && (
          <div className="mt-4 rounded-md border border-red-500/50 bg-red-950/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!otpId ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="email"
              required
              placeholder="Super Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-md p-2 text-white"
            />

            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-md p-2 text-white"
            />

            <input
              type="password"
              required
              placeholder="Secret Key"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-md p-2 text-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Initializing…' : 'Initialize Session'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <input
              type="text"
              required
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-md p-2 text-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
