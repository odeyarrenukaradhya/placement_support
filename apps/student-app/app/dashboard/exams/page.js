'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Clock, Layout, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/exams')
      .then(setExams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Frontend-only state logic
  const getExamState = (exam) => {
    const now = new Date();
    const end = new Date(exam.end_time);

    if (exam.is_attempted) return 'ATTENDED';
    if (now > end) return 'NOT_AVAILABLE';
    return 'AVAILABLE';
  };

  const StatusBadge = ({ state }) => {
    const styles = {
      AVAILABLE: 'bg-blue-50 text-blue-600',
      ATTENDED: 'bg-green-50 text-green-600',
      NOT_AVAILABLE: 'bg-slate-100 text-slate-500',
    };

    const labels = {
      AVAILABLE: 'Available',
      ATTENDED: 'Attended',
      NOT_AVAILABLE: 'Not Available',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[state]}`}
      >
        {labels[state]}
      </span>
    );
  };

  const ExamCard = ({ exam }) => {
    const state = getExamState(exam);
    const clickable = state === 'AVAILABLE';

    return (
      <div
        className={`bg-white rounded-[1.75rem] p-5 border border-slate-100 shadow-sm
        transition-all
        ${clickable ? 'hover:border-blue-100 hover:shadow-md' : 'opacity-70'}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <StatusBadge state={state} />
          <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
            <Layout size={16} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-slate-900 tracking-tight mb-2 leading-snug">
          {exam.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
          <Clock size={12} className="text-blue-400" />
          {exam.duration} min
        </div>

        {/* Action */}
        {clickable ? (
          <Link
            href={`/dashboard/exams/${exam.id}`}
            className="flex items-center justify-center gap-2 w-full
            bg-slate-900 text-white py-2.5 rounded-xl
            text-[10px] font-black uppercase tracking-widest
            hover:bg-blue-600 transition-all"
          >
            Start
            <ChevronRight size={14} />
          </Link>
        ) : (
          <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2.5">
            {state === 'ATTENDED' ? 'Completed' : 'Closed'}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Dashboard-style header */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
            Assessments
          </p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Exams
          </h2>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-white h-40 rounded-[1.75rem] border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-[1.75rem] p-10 border border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-sm">
              No exams assigned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {exams.map(exam => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}