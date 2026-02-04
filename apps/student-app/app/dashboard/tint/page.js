'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'aptitude', label: 'Aptitude' },
  { key: 'logical', label: 'Logical' },
  { key: 'verbal', label: 'Verbal' },
  { key: 'interview', label: 'Interview' },
];

export default function StudentTintPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    apiFetch('/tint')
      .then(setMaterials)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredMaterials =
    selectedCategory === 'all'
      ? materials
      : materials.filter(m => m.category === selectedCategory);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
            Learning Toolkit
          </p>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Training & Interview Notes (TINT)
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                ${
                  selectedCategory === cat.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="bg-white h-36 rounded-[1.5rem] border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] p-10 border border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-sm">
              No materials available for this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMaterials.map(m => (
              <div
                key={m.id}
                className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm
                hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
                    <FileText size={16} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {m.title}
                  </p>
                </div>

                <a
                  href={m.file_url}
                  target="_blank"
                  className="inline-flex items-center justify-center w-full
                  text-[10px] font-black uppercase tracking-widest
                  bg-slate-100 text-slate-600 py-2 rounded-xl
                  hover:bg-blue-600 hover:text-white transition-colors"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}