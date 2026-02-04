'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { Trophy, Medal, Award, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';

/* ---------- helpers ---------- */
const formatYearLabel = (year) => {
  if (year === 'All') return 'All Years';
  if (year === 1) return '1st Year';
  if (year === 2) return '2nd Year';
  if (year === 3) return '3rd Year';
  return `${year}th Year`;
};

export default function StudentProgressPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [year, setYear] = useState('All');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setCurrentUser(JSON.parse(userData));

    apiFetch('/analytics/student/rankings')
      .then(setRankings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ---------- derive years from data ---------- */
  const availableYears = useMemo(() => {
    const yrs = rankings.map(r => r.year).filter(Boolean);
    return ['All', ...Array.from(new Set(yrs)).sort((a, b) => a - b)];
  }, [rankings]);

  /* ---------- frontend filtering ---------- */
  const filteredRankings = useMemo(() => {
    if (year === 'All') return rankings;
    return rankings.filter(r => r.year === Number(year));
  }, [rankings, year]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={18} />;
    if (rank === 2) return <Medal className="text-slate-400" size={18} />;
    if (rank === 3) return <Award className="text-orange-500" size={18} />;
    return <span className="font-black text-slate-500 text-sm">{rank}</span>;
  };

  const getRowStyle = (studentId) =>
    currentUser?.id === studentId
      ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
      : 'bg-white border-slate-100 hover:bg-slate-50';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
            Performance
          </p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Class Standings
          </h2>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={16} />
            <span className="text-xs font-black text-black uppercase tracking-widest">
              Year
            </span>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-50
              border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-black"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>
                {formatYearLabel(y)}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-4 border-blue-600 rounded-full" />
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              No data for selected year
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRankings.map(student => (
              <div
                key={student.student_id}
                className={`rounded-2xl p-4 border shadow-sm transition-all ${getRowStyle(student.student_id)}`}
              >
                <div className="flex items-center justify-between">

                  {/* Left */}
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-slate-100">
                      {getRankIcon(student.rank)}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-800">
                        {student.name}
                        {currentUser?.id === student.student_id && (
                          <span className="ml-2 text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            YOU
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400">
                        {formatYearLabel(student.year)}
                      </p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">
                      {student.total_score}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Points
                    </p>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}