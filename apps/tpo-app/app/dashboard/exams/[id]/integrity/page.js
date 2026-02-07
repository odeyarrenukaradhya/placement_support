'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ExamIntegrityPage() {
  const { id: examId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/exams/${examId}/integrity`)
      .then(setLogs)
      .catch(err => {
        console.error(err);
        alert('Failed to fetch logs');
      })
      .finally(() => setLoading(false));
  }, [examId]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-8 text-black">Exam Integrity Monitor</h2>

      {loading ? (
        <p className="text-slate-500 animate-pulse">Loading compliance data...</p>
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Violation Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-red-50/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{log.student_name}</div>
                    <div className="text-xs text-slate-500">{log.student_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                      ['tab_hidden', 'window_blur'].includes(log.type) ? 'bg-amber-100 text-amber-700' :
                      ['copy_attempt', 'paste_attempt', 'forbidden_key_press'].includes(log.type) ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">
                    {log.metadata ? JSON.stringify(log.metadata) : '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-green-600 font-bold bg-green-50">
                        No integrity violations recorded. Clean session.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
