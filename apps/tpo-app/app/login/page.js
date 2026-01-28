'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export default function TPOLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      if (res.status === 'OTP_REQUIRED') {
        setOtpId(res.otpId);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otpId, otp }),
      });
      
      // Changed role check to 'tpo'
      if (res.user.role !== 'tpo') throw new Error('Access denied: Unauthorized role');
      
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      document.cookie = `token=${res.token}; path=/; max-age=86400; SameSite=Lax`;
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen bg-white overflow-hidden fixed inset-0">
      
      {/* LEFT SIDE: Matching Student Portal Style */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
            {/* Swapped Image for TPO Context */}
            <img 
              src="https://lh3.googleusercontent.com/u/0/d/1SFFX-jM9BDZeY-lA02nWc-nzqmcGgQU8" 
              alt="TPO Illustration" 
              className="max-w-md w-full max-h-[65vh] object-contain drop-shadow-2xl rounded-3xl"
            />
            <div className="mt-8 text-center max-w-sm">
              <h1 className="text-2xl xl:text-3xl font-black text-blue-900 leading-tight">
                Training & Placement Officer
              </h1>
              <p className="mt-2 text-blue-600 font-medium text-sm xl:text-base">
                Managing corporate relations and student careers effectively.
              </p>
            </div>
        </div>
      </div>

      {/* RIGHT SIDE: Vertical Centering */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 bg-white overflow-hidden">
        <div className="w-full max-w-md flex flex-col">
          
          <div className="mb-6 text-center lg:text-left shrink-0">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-gray-900 tracking-tight">TPO Login</h2>
            <p className="mt-2 text-gray-500 font-medium text-sm">Access the administrative placement portal.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-600 shrink-0"></div>
              {error}
            </div>
          )}

          <div className="flex-1">
            {!otpId ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">Official Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-base text-gray-900 font-bold outline-none transition-all shadow-sm placeholder:text-gray-400"
                      placeholder="tpo@kit.edu"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-11 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-base text-gray-900 font-bold outline-none transition-all shadow-sm placeholder:text-gray-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-3 py-3.5 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-[0.98] transition-all"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Sign In <ArrowRight size={18} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100 shrink-0">
                  <ShieldCheck className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-blue-900">Check your email</h3>
                  <p className="text-xs text-blue-700 mt-1">OTP sent to {email}</p>
                </div>

                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center text-4xl tracking-[0.5em] font-mono font-black py-6 border-2 border-gray-100 rounded-3xl focus:border-blue-500 outline-none bg-white text-gray-900 shadow-inner"
                  placeholder="000000"
                />
                
                <button
                  type="submit"
                  className="w-full py-3.5 text-sm font-black rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-[0.98] transition-all"
                >
                  Confirm Code
                </button>

                <button 
                  type="button" 
                  onClick={() => setOtpId(null)} 
                  className="w-full text-[10px] font-bold text-gray-400 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <RefreshCw size={12} /> Use Different Account
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 border-t border-gray-100 pt-4 shrink-0">
            {/* Removed Register link - Kept Forgot Password */}
            <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}