'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/exams')
      .then(setExams)
      .catch(err => {
        console.error("Failed to fetch exams:", err?.error || err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Manage Placement Exams</h2>

      </div>

      {loading ? (
        <p className="text-gray-600">Loading exams...</p>
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{exam.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono tracking-wider">{exam.code || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{exam.duration} mins</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-bold">{exam.question_count || 0} Qs</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(exam.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dashboard/exams/${exam.id}/results`} className="text-blue-600 hover:text-blue-800 font-bold mr-4">Results</Link>
                    <Link href={`/dashboard/exams/${exam.id}/integrity`} className="text-amber-600 hover:text-amber-800 font-bold mr-4">Integrity Report</Link>
                    <button className="text-red-500 hover:text-red-700 font-bold">Delete</button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No exams created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
