"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  FileQuestion,
  AlertTriangle,
} from "lucide-react";
import ParticleCard from "@/components/ParticleCard";
import { apiFetch } from '@/lib/api';
import PieChart from "@/components/PieChart";
import EventCalendar from "@/components/EventCalendar";

export default function AdminDashboard() {
  const router = useRouter();

  // State
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalAttempts: 0,
    totalStudents: 0,
    averageScore: 0,
    performanceDistribution: { high: 0, average: 0, low: 0 }
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentViolations, setRecentViolations] = useState([]);

  // Initialize Data
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userData) setUser(JSON.parse(userData));

    async function fetchData() {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      try {
        const [statsData, examsData, violationsData] = await Promise.all([
          apiFetch('/analytics/tpo/dashboard-stats').catch(err => { console.error("Stats fetch failed:", err); return {}; }),
          apiFetch('/exams').catch(err => { console.error("Exams fetch failed:", err); return []; }),
          apiFetch('/analytics/tpo/recent-violations').catch(err => { console.error("Violations fetch failed:", err); return []; })
        ]);

        setStats({
          totalQuizzes: statsData.exam_count || 0,
          totalAttempts: statsData.total_attempts || 0,
          totalStudents: statsData.student_count || 0,
          averageScore: statsData.average_score || 0,
          performanceDistribution: statsData.performance_distribution || { high: 0, average: 0, low: 0 }
        });

        if (Array.isArray(examsData)) {
          setRecentQuizzes(examsData.slice(0, 4));
        }

        if (Array.isArray(violationsData)) {
          setRecentViolations(violationsData);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex-1 p-3 pt-4 lg:p-5 lg:pt-0">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12 relative z-10">
        <StatCard title="Total Quizzes" value={stats.totalQuizzes} />
        <StatCard title="Total Attempts" value={stats.totalAttempts} />
        <StatCard title="Active Students" value={stats.totalStudents} />
        <StatCard
          title="Avg Score"
          value={`${stats.averageScore}%`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6 h-full">

          {/* Recent Quizzes (Top) */}
          <div className="bg-white rounded-2xl p-6 shadow flex flex-col flex-1 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-blue-700 text-lg flex items-center gap-2">
                <FileQuestion size={20} />
                Recent Quizzes
              </h2>
              <Link href="/dashboard/exams" className="text-sm text-blue-500 hover:underline">View All</Link>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {recentQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition border border-blue-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileQuestion size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{quiz.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">Code: {quiz.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded text-blue-600 shadow-sm border border-blue-100">
                      {quiz.question_count || 0} Qs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart (Bottom) */}
          <div className="bg-white rounded-2xl p-6 shadow flex flex-col justify-center h-full max-h-[300px]">
            <PieChart
              title="Student Performance (Avg)"
              data={[
                { label: 'High Score (>80%)', value: stats.performanceDistribution.high, color: 'text-green-500', bgClass: 'bg-green-500' },
                { label: 'Average (50-80%)', value: stats.performanceDistribution.average, color: 'text-blue-500', bgClass: 'bg-blue-500' },
                { label: 'Needs Impr. (<50%)', value: stats.performanceDistribution.low, color: 'text-red-500', bgClass: 'bg-red-500' }
              ]}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 h-full">
          <div className="flex-1 min-h-[400px]">
            <EventCalendar />
          </div>

          {/* Monitoring Alerts */}
          <ParticleCard glowColor="239, 68, 68" particleCount={15} className="bg-white rounded-2xl shadow">
            <div className="p-6 h-full flex flex-col max-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-red-600 text-lg flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Monitoring Alerts
                </h2>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {recentViolations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-4">
                    <TrendingUp size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No recent violations</p>
                  </div>
                ) : (
                  recentViolations.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 rounded-xl bg-red-50 border border-red-100 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800">
                          {attempt.studentName}
                        </span>
                        <span className="text-xs font-bold text-red-500 bg-white px-2 py-1 rounded-full shadow-sm">
                          {attempt.violations.length} Alerts
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {attempt.violations.slice(0, 3).map((v, i) => (
                          <span
                            key={i}
                            className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-red-100 text-red-700"
                          >
                            {v.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ParticleCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <ParticleCard glowColor="59, 130, 246" particleCount={8}>
      <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-500 hover:-translate-y-2 group relative hover:z-50">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-800 group-hover:scale-110 transition-transform origin-left">{value}</p>
      </div>
    </ParticleCard>
  );
}
