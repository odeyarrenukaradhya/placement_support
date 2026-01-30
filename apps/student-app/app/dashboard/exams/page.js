'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Clock, BookOpen, ChevronRight, Layout, Sparkles } from 'lucide-react';
import gsap from 'gsap';

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    apiFetch('/exams')
      .then(setExams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && exams.length > 0) {
      gsap.fromTo(".exam-card", 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [loading, exams]);

  return (
    <div className="p-8 bg-[#FDFDFF] min-h-screen font-sans" ref={containerRef}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">
              Exam <span className="text-blue-600">Horizon</span>
            </h2>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-300 p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse">
                <div className="h-10 bg-slate-50 rounded-2xl w-3/4 mb-8"></div>
                <div className="space-y-4 mb-10">
                  <div className="h-4 bg-slate-50 rounded-lg w-1/2"></div>
                  <div className="h-4 bg-slate-50 rounded-lg w-1/3"></div>
                </div>
                <div className="h-14 bg-slate-50 rounded-2xl w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {exams.filter(e => !e.is_attempted).map((exam) => (
              <div 
                key={exam.id} 
                className="exam-card group relative bg-gray-300 p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-blue-100 hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] transition-all duration-500 flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-500"></div>
                
                <div className="relative z-10">
                  <div className="mb-8 inline-flex p-4 rounded-3xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500">
                    <Layout size={28} />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {exam.title}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-6 mb-10">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm tracking-tight">
                      <Clock size={18} className="text-blue-400" />
                      <span className="text-slate-600">{exam.duration} Minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm tracking-tight">
                      <BookOpen size={18} className="text-blue-400" />
                      <span className="text-slate-600">Standardized</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-auto">
                    <Link 
                      href={`/dashboard/exams/${exam.id}`} 
                      className="flex items-center justify-center gap-3 w-full bg-slate-950 text-white py-5 rounded-3xl font-black tracking-widest uppercase text-sm hover:bg-blue-600 shadow-xl hover:shadow-blue-600/20 active:scale-95 transition-all duration-300 group/btn"
                    >
                      Initialize Exam Session
                      <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                    </Link>
                </div>
              </div>
            ))}
            
            {(exams.length === 0 || exams.every(e => e.is_attempted)) && (
              <div className="col-span-full bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                <div className="inline-flex p-8 rounded-full bg-slate-50 text-slate-200 mb-8">
                  <Layout size={64} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3">NO Active Exams Detected</h4>
                <p className="text-slate-400 font-medium text-lg">No active assessments are currently scheduled for your profile.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

