'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ colleges: 0, users: 0, exams: 0, attempts: 0 });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.replace('/admin/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.role !== 'admin') {
      router.replace('/admin/login');
      return;
    }

    setUser(parsedUser);

    apiFetch('/admin/stats')
      .then(setStats)
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-64 border-r border-gray-800 flex flex-col">
        <div className="p-8 text-xl font-black tracking-tighter text-red-600">
          CORE SYSTEM
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          <Link href="/admin/dashboard" className="block px-4 py-2 bg-gray-900 border border-gray-800 rounded">
            Overview
          </Link>
          <Link href="/admin/dashboard/colleges" className="block px-4 py-2 text-gray-400 hover:text-white">
            Colleges
          </Link>
          <Link href="/admin/dashboard/tpos" className="block px-4 py-2 text-gray-400 hover:text-white">
            TPO Management
          </Link>
          <Link href="/admin/dashboard/logs" className="block px-4 py-2 text-gray-400 hover:text-white">
            System Logs
          </Link>
          <Link href="/admin/dashboard/analytics" className="block px-4 py-2 text-gray-400 hover:text-white">
            Analytics
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="p-8 text-left text-gray-500 hover:text-red-500"
        >
          TERMINATE SESSION
        </button>
      </aside>

      <main className="flex-1 p-12">
        <h2 className="text-4xl font-black mb-12 italic underline decoration-red-600">
          ADMIN CONTROL CENTER
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 p-6">
            <div className="uppercase text-xs font-bold text-gray-500 mb-4">Total Colleges</div>
            <div className="text-5xl font-mono text-red-500">{stats.colleges}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6">
            <div className="uppercase text-xs font-bold text-gray-500 mb-4">Global Users</div>
            <div className="text-5xl font-mono text-red-500">{stats.users}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6">
            <div className="uppercase text-xs font-bold text-gray-500 mb-4">Active Exams</div>
            <div className="text-5xl font-mono text-red-500">{stats.exams}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6">
            <div className="uppercase text-xs font-bold text-gray-500 mb-4">Exam Attempts</div>
            <div className="text-5xl font-mono text-red-500">{stats.attempts}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
