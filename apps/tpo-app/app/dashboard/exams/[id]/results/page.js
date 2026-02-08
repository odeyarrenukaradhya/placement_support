'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ExamResultsPage() {
  const { id: examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
      apiFetch(`/analytics/tpo/exam-stats/${examId}`)
        .then(setData)
        .finally(() => setLoading(false));
  }, [examId]);

  const handleViewLogs = async (attemptId, studentName) => {
    setSelectedAttempt({ id: attemptId, name: studentName });
    setLogsLoading(true);
    try {
        const data = await apiFetch(`/attempts/${attemptId}/logs`);
        setLogs(data);
    } catch (err) {
        alert('Failed to fetch logs');
    } finally {
        setLogsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!data || !data.results) return;

    const headers = ["Student Name", "USN", "Year", "Marks", "Integrity"];
    const rows = data.results.map(r => [
      r.student_name,
      r.usn || '-',
      r.year || '-',
      r.score,
      r.integrity_summary || 'None'
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(value => {
          const val = String(value).replace(/"/g, '""');
          return `"${val}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `Result - ${data.exam_title || examId}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-black">Exam Participation & Results</h2>
        {!loading && data && (
            <button 
                onClick={handleDownloadCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download CSV
            </button>
        )}
      </div>

      {loading ? <p>Calculating statistics...</p> : (
        <div className="space-y-8">
            <div className="bg-blue-900 p-8 rounded-xl text-white flex justify-between items-center shadow-lg">
                <div>
                    <h3 className="text-blue-200 uppercase text-xs font-bold tracking-widest mb-1">Total Participation</h3>
                    <div className="text-5xl font-black">{data.total_attempts}</div>
                </div>
                <div className="text-right">
                    <div className="text-blue-200 uppercase text-xs font-bold tracking-widest mb-1">Audit Status</div>
                    <div className="text-xl font-bold">Secure</div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">USN</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Year</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Final Score</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Integrity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.results.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-500">{r.student_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{r.usn || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{r.year || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-green-600">{r.score}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleViewLogs(r.id, r.student_name)}
                                        className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        View Logs
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Logs Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-lg">Integrity Log: {selectedAttempt.name}</h3>
                    <button onClick={() => setSelectedAttempt(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-black">&times;</button>
                </div>
                
                <div className="p-0 overflow-y-auto flex-1">
                    {logsLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-green-600 font-bold bg-green-50 m-4 rounded-lg">
                            No suspicious activity recorded.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Event</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Metadata</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-red-50/10">
                                        <td className="px-6 py-3 text-xs font-mono text-gray-500">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-3 text-xs font-bold text-gray-800">
                                            {log.type}
                                        </td>
                                        <td className="px-6 py-3 text-xs font-mono text-gray-500">
                                            {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                    <button 
                        onClick={() => setSelectedAttempt(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold text-sm"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
