"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    ClipboardList,
    Wrench,
    Users,
    LogOut,
    Bell,
    Menu,
    X,
    PlusCircle,
    MessageSquare,
} from "lucide-react";
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

    // Mock Notifications
    const notifications = [
        { id: 1, title: "New student registered", time: "2m ago", type: "info" },
        { id: 2, title: "Server maintenance", time: "1h ago", type: "alert" },
        { id: 3, title: "Placement drive updated", time: "3h ago", type: "success" },
    ];

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const userData = sessionStorage.getItem("user");
        
        if (!token || !userData) {
            router.push("/login");
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch (e) {
            console.error('Failed to parse user from session storage');
            router.push("/login");
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        router.push("/login");
    };

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { href: "/dashboard/exams", label: "Manage Exams", icon: <ClipboardList size={18} /> },
        { href: "/dashboard/tint", label: "TINT Toolkit", icon: <Wrench size={18} /> },
        { href: "/dashboard/students", label: "Students", icon: <Users size={18} /> },
        { href: "/dashboard/circulars", label: "Circulars", icon: <MessageSquare size={18} /> },
    ];

    return (
        <div className="h-screen bg-[#e8edff] flex overflow-hidden font-sans">
            {/* Sidebar (Desktop Only) */}
            <aside className="hidden lg:flex w-72 bg-white shadow-2xl p-6 z-20 flex-col relative overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                        T
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 leading-none">Placement</h1>
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Support</span>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
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
                    className="mt-6 flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-3 rounded-xl transition-colors"
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
                    <Menu size={24} />
                </button>

                <span className="flex-1 text-center text-sm font-bold truncate text-blue-600">
                    <TextType
                        text={`Hello, ${user?.name || "Officer"}`}
                        typingSpeed={60}
                        pauseDuration={1200}
                        cursorCharacter="_"
                        className="inline"
                        showCursor
                        textColors={["blue"]}
                    />
                </span>

                <div className="flex items-center gap-3 relative">
                    <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-200">
                        {user?.name?.charAt(0) || "T"}
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
                    <aside className="fixed top-0 left-0 h-full w-[280px] bg-white z-50 p-6 lg:hidden animate-in slide-in-from-left duration-300 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <span className="font-black text-xl text-blue-700 tracking-tight">Navigation</span>
                            <button
                                onClick={() => setMobileSidebarOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="space-y-3">
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
                            className="mt-4 flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors w-full"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </aside>
                </>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8 pb-20 bg-[#f8fbff]">
                {/* Desktop Top Bar (Hidden on Mobile) */}
                <div className="hidden lg:flex justify-between items-center mb-16 relative z-0">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        <TextType
                            text={`Welcome back, ${user?.name || "Officer"}`}
                            typingSpeed={40}
                            pauseDuration={2000}
                            cursorCharacter="|"
                            className="inline"
                            showCursor
                            textColors={["#1e293b"]}
                        />
                    </h1>

                    <div className="flex items-center gap-6 relative">
                        <Link
                            href="/dashboard/exams/new"
                            className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                        >
                            <PlusCircle size={18} />
                            <span>Create Quiz</span>
                        </Link>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-slate-900 leading-none">{user?.name}</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">TPO Admin</span>
                            </div>
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-xl shadow-blue-200 group-hover:rotate-6 transition-transform">
                                {user?.name?.charAt(0) || "T"}
                            </div>
                        </div>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
