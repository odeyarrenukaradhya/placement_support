"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  User,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";

export default function StudentSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college_id: "",
  });
  const [colleges, setColleges] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/colleges").then(setColleges).catch(console.error);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: "student",
        }),
      });
      router.push("/login?registered=true");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen bg-white overflow-hidden fixed inset-0">
      {/* LEFT SIDE: 50% Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <img
            src="https://lh3.googleusercontent.com/u/0/d/1ZA_M9T8KK_HTabxlwIDr41wHD7e7RWGc"
            alt="Signup Illustration"
            className="max-w-md w-full max-h-[65vh] object-contain drop-shadow-2xl rounded-3xl"
          />
          <div className="mt-8 text-center max-w-sm">
            <h1 className="text-2xl xl:text-3xl font-black text-blue-900 leading-tight">
              Placement Guidance Platform
            </h1>
            <p className="mt-2 text-blue-600 font-medium text-sm">
              Empowering students to reach their career goals with ease.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: 50% Compact Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 bg-white overflow-hidden relative">
        <div className="w-full max-w-sm flex flex-col">
          <div className="mb-6 text-center lg:text-left shrink-0">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Student Signup
            </h2>
            <p className="mt-1 text-gray-500 font-medium text-xs">
              Create your profile and get started.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-600 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0"></div>
              {error}
            </div>
          )}

          <form
            onSubmit={handleSignup}
            className="space-y-3 flex-1 overflow-y-auto pr-1"
          >
            {/* Full Name */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="block w-full pl-9 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-gray-900 font-bold outline-none transition-all placeholder:font-normal"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="block w-full pl-9 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-gray-900 font-bold outline-none transition-all placeholder:font-normal"
                  placeholder="student@kit.edu"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="block w-full pl-9 pr-10 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-gray-900 font-bold outline-none transition-all placeholder:font-normal"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="block w-full pl-9 pr-10 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-gray-900 font-bold outline-none transition-all placeholder:font-normal"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* College */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">
                Institution
              </label>
              <div className="relative group">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <select
                  required
                  value={formData.college_id}
                  onChange={(e) =>
                    setFormData({ ...formData, college_id: e.target.value })
                  }
                  className="block w-full pl-9 pr-10 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-gray-900 font-bold outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select College</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 mt-3 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md active:scale-[0.98] transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  Register <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-1 border-t border-gray-100 pt-4 shrink-0">
            <Link
              href="/login"
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
