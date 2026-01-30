"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Trophy, Medal, Award, User } from "lucide-react";

export default function StudentProgressPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user for highlighting
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    // Fetch rankings
    apiFetch("/analytics/student/rankings")
      .then(setRankings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Award className="text-orange-500" size={24} />;
      default:
        return (
          <span className="font-bold text-slate-500 w-6 text-center">
            {rank}
          </span>
        );
    }
  };

  const getRowStyle = (studentId) => {
    const isCurrentUser = currentUser?.id === studentId;
    if (isCurrentUser) return "bg-blue-50 border-blue-200 ring-2 ring-blue-100";
    return "bg-white border-slate-100 hover:bg-slate-50";
  };

  return (
    <div className="p-4 md:p-8 bg-[#e8edff] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight italic">
              Class Standings
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Track your progress against peers.
            </p>
          </div>

          {/* User's Current Rank Summary */}
          {!loading && currentUser && (
            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Your Rank
                </p>
                <p className="text-2xl font-black text-blue-600 leading-none">
                  #
                  {rankings.find((r) => r.student_id === currentUser.id)
                    ?.rank || "-"}
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Total Score
                </p>
                <p className="text-lg font-bold text-slate-800 leading-none">
                  {rankings.find((r) => r.student_id === currentUser.id)
                    ?.total_score || 0}
                </p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">
              Calculating Ranks...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Row (Hidden on mobile) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-6">Student</div>
              <div className="col-span-2 text-center">Exams</div>
              <div className="col-span-3 text-right">Total Score</div>
            </div>

            {/* List Items */}
            {rankings.map((student) => (
              <div
                key={student.student_id}
                className={`rounded-2xl p-4 md:p-6 shadow-sm border transition-all ${getRowStyle(student.student_id)}`}
              >
                <div className="flex items-center justify-between md:grid md:grid-cols-12 md:gap-4">
                  {/* Rank & Name Section */}
                  <div className="flex items-center gap-4 md:col-span-7">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100">
                      {getRankIcon(student.rank)}
                    </div>
                    <div>
                      <h3
                        className={`font-bold text-lg ${currentUser?.id === student.student_id ? "text-blue-700" : "text-slate-800"}`}
                      >
                        {student.name}
                        {currentUser?.id === student.student_id && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full align-middle">
                            YOU
                          </span>
                        )}
                      </h3>
                      <p className="md:hidden text-xs font-semibold text-slate-400 mt-0.5">
                        {student.exams_taken} Exams Taken
                      </p>
                    </div>
                  </div>

                  {/* Desktop Stats */}
                  <div className="hidden md:flex md:col-span-2 items-center justify-center">
                    <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                      {student.exams_taken}
                    </span>
                  </div>

                  {/* Score Section */}
                  <div className="flex flex-col items-end md:col-span-3 md:justify-center">
                    <span className="text-2xl font-black text-slate-900">
                      {student.total_score}
                    </span>
                    <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase">
                      Points
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {rankings.length === 0 && (
              <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest">
                  No rankings available yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
