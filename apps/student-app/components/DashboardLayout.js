"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BookOpen,
  ClipboardList,
  TrendingUp,
  LogOut,
  Bell,
  Map,
  X,
  Megaphone,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import TextType from "@/components/TextType";

export function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer font-semibold transition-all duration-200
      ${active ? "bg-blue-100 text-blue-700 shadow-sm" : "hover:bg-slate-100 text-slate-600"}`}
    >
      {icon}
      {label}
    </div>
  );
}

export function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [circulars, setCirculars] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userData = sessionStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));

    // Fetch circulars for notification bell
    const fetchCircularsData = async () => {
      try {
        const data = await apiFetch("/circulars");
        setCirculars(data || []);
      } catch (err) {
        console.error("Failed to fetch circulars for notifications:", err);
      }
    };
    fetchCircularsData();
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: <Home size={18} /> },
    { href: "/dashboard/exams", label: "Exams", icon: <ClipboardList size={18} /> },
    { href: "/dashboard/tint", label: "Materials", icon: <BookOpen size={18} /> },
    { href: "/dashboard/progress", label: "Progress", icon: <TrendingUp size={18} /> },
    { href: "/dashboard/career-mapping", label: "Career Mapping", icon: <Map size={18} /> },
  ];

  const NotificationsPanel = () => (
    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-slate-800 tracking-tight">Recent Circulars</h3>
        <button onClick={() => setShowNotifications(false)}>
          <X size={16} className="text-slate-400 hover:text-slate-600" />
        </button>
      </div>
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {circulars.length === 0 ? (
          <div className="py-8 text-center">
            <Megaphone size={24} className="mx-auto text-slate-200 mb-2" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No new circulars</p>
          </div>
        ) : (
          circulars.map((n) => (
            <div key={n.id} className="p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition cursor-pointer flex gap-3 items-start group">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Megaphone size={14} className="text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{n.title}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {new Date(n.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-6 pt-4 text-center border-t border-slate-50">
        <Link
          href="/dashboard"
          onClick={() => setShowNotifications(false)}
          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
        >
          View all on dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#e8edff] flex overflow-hidden font-sans">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden lg:block w-64 bg-white shadow-2xl p-6 z-20 flex-shrink-0 relative overflow-y-auto custom-scrollbar">
        <div className="relative group cursor-pointer mb-4 flex items-center justify-center">
          <img src="https://lh3.googleusercontent.com/u/0/d/1f4qSF9eLf0IFr_bIiajaCJJkyuW2l_OB" alt="Platform Logo" className="h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute -inset-3 bg-blue-100 rounded-full blur-xl opacity-30" />
        </div>
        <nav className="space-y-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <SidebarItem
                icon={item.icon}
                label={item.label}
                active={pathname === item.href}
              />
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-12 flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* ================= MOBILE TOP BAR ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md shadow-sm z-30 flex items-center px-6 gap-4">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 -ml-2 text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
        >
          <span className="text-2xl">☰</span>
        </button>

        <span className="flex-1 text-center text-sm font-bold truncate text-blue-600">
          <TextType
            text={`Hello, ${user?.name || "Student"}`}
            typingSpeed={60}
            pauseDuration={1200}
            cursorCharacter="_"
            className="inline"
            showCursor
            textColors={["blue"]}
          />
        </span>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Bell size={18} />
            {circulars.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          {showNotifications && <NotificationsPanel />}
          <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-200">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>

      {/* ================= MOBILE SIDEBAR ================= */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-[280px] bg-white z-50 p-8 lg:hidden animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-10">
              <span className="font-black text-xl text-blue-700 tracking-tight">Navigation</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >✕</button>
            </div>

            <div className="flex items-center justify-center mb-6">
              <img
                src="https://lh3.googleusercontent.com/u/0/d/1f4qSF9eLf0IFr_bIiajaCJJkyuW2l_OB"
                alt="Platform Logo"
                className="h-28 w-auto"
              />
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileSidebarOpen(false)}>
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    active={pathname === item.href}
                  />
                </Link>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-10 flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-4 bg-[#f8fbff]">
        {/* Desktop Top Bar (Hidden on Mobile) */}
        <div className="hidden lg:flex justify-between items-center mb-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            <TextType
              text={`Hello, ${user?.name || "Student"}`}
              typingSpeed={60}
              pauseDuration={1200}
              cursorCharacter="_"
              className="inline"
              showCursor
              textColors={["#1e293b"]}
            />
          </h1>

          <div className="flex items-center gap-6 relative">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
              >
                <Bell size={20} />
                {circulars.length > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {showNotifications && <NotificationsPanel />}
            </div>

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 hover:opacity-80 transition group"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 leading-none">{user?.name}</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Student Account</span>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-xl shadow-blue-200 group-hover:rotate-6 transition-transform">
                {user?.name?.charAt(0) || "U"}
              </div>
            </Link>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
