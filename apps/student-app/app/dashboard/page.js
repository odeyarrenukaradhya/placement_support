"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import TextType from "@/components/TextType";
import ParticleCard from "@/components/ParticleCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Bell } from "lucide-react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BAR_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-cyan-600",
  "bg-teal-600",
  "bg-purple-600",
  "bg-pink-600",
];

export default function StudentDashboard() {
  // State
  const [stats, setStats] = useState({
    totalTests: 0,
    completedTests: 0,
    availableTests: 0,
    averageScore: 0,
  });
  const [courseActivity, setCourseActivity] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Initialize Events from LocalStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem("studentEvents");
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    } else {
      setEvents([
        {
          id: 1,
          date: 15,
          month: new Date().getMonth(),
          year: new Date().getFullYear(),
          title: "Java Exam",
        },
        {
          id: 2,
          date: 18,
          month: new Date().getMonth(),
          year: new Date().getFullYear(),
          title: "DSA Test",
        },
      ]);
    }
  }, []);

  // 2. Persist Events when they change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem("studentEvents", JSON.stringify(events));
    }
  }, [events]);

  // 3. Fetch Data
  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [statsData, scores] = await Promise.all([
          apiFetch("/analytics/student/dashboard-stats"),
          apiFetch("/analytics/student/my-scores"),
        ]);

        if (!mounted) return;

        const upcoming = statsData?.upcoming_exams ?? 0;
        const completed = statsData?.completed_attempts ?? 0;

        // Calculate individual accuracies first
        const testAccuracies = (scores || []).map(s => {
          const total = Number(s.total_questions) || 0;
          const score = Number(s.score) || 0;
          return total > 0 ? (score / total) * 100 : 0;
        });

        // Calculate average accuracy
        const avgAccuracy = testAccuracies.length 
          ? Math.round(testAccuracies.reduce((a, b) => a + b, 0) / testAccuracies.length)
          : 0;

        setStats({
          totalTests: upcoming + completed,
          completedTests: completed,
          availableTests: upcoming,
          averageScore: avgAccuracy,
        });

        const activity = (scores || []).map((s, i) => {
          const totalQuestions = Number(s.total_questions) || 0;
          const correctAnswers = Number(s.score) || 0;
          const accuracy = totalQuestions > 0 
            ? Math.round((correctAnswers / totalQuestions) * 100) 
            : 0;

          return {
            course: s.exam_title || `Test ${i + 1}`,
            score: accuracy,
            rawScore: correctAnswers,
            total: totalQuestions,
            date: s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : 'N/A'
          };
        });

        setCourseActivity(activity);
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Test" value={stats.totalTests} />
        <StatCard title="Completed Test" value={stats.completedTests} />
        <StatCard title="Available Tests" value={stats.availableTests} />
        <StatCard
          title="Average Score"
          value={stats.averageScore ? `${stats.averageScore}%` : "0%"}
        />
      </div>

      {/* Courses and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <h2 className="text-lg font-black mb-10 text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            Performance Analytics
          </h2>

          {/* Line Chart Container */}
          <div className="flex gap-4 flex-1 relative min-h-0">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between items-end pr-2 h-full text-[10px] font-black text-slate-400 uppercase tracking-widest pb-6">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* SVG Chart Area */}
            <div className="flex-1 relative flex flex-col h-full overflow-hidden">
               <div className="flex-1 relative border-l border-b border-slate-100">
                  {courseActivity.length > 1 ? (
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full p-2 overflow-visible">
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area Fill */}
                      <path
                        d={`M 0 100 ${courseActivity.map((test, i) => 
                          `L ${(i / (courseActivity.length - 1)) * 100} ${100 - test.score}`
                        ).join(' ')} L 100 100 Z`}
                        fill="url(#areaGradient)"
                      />

                      {/* Main Line */}
                      <path
                        d={courseActivity.map((test, i) => 
                          `${i === 0 ? 'M' : 'L'} ${(i / (courseActivity.length - 1)) * 100} ${100 - test.score}`
                        ).join(' ')}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-in fade-in duration-1000"
                      />

                      {/* Data Points */}
                      {courseActivity.map((test, i) => (
                        <circle
                          key={i}
                          cx={(i / (courseActivity.length - 1)) * 100}
                          cy={100 - test.score}
                          r="2.5"
                          fill="white"
                          stroke="#2563eb"
                          strokeWidth="2"
                          className="hover:r-4 transition-all duration-300 cursor-pointer"
                        >
                          <title>{`${test.course}: ${test.score}%`}</title>
                        </circle>
                      ))}
                    </svg>
                  ) : courseActivity.length === 1 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-center">
                          <div className="w-4 h-4 rounded-full bg-blue-600 animate-ping mb-4 mx-auto"></div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{courseActivity[0].score}% Accuracy</p>
                       </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                      No Data Points Available
                    </div>
                  )}
               </div>

               {/* X-axis labels */}
               <div className="h-6 flex justify-between px-0 pt-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {courseActivity.length > 0 ? (
                    courseActivity.map((test, i) => (
                      <span 
                        key={i} 
                        className="flex-1 text-center"
                        title={test.course}
                      >
                        {courseActivity.length > 5 ? `T${i + 1}` : test.course.split(' ')[0]}
                      </span>
                    ))
                  ) : (
                    <span className="w-full text-center">Empty Horizon</span>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <ParticleCard glowColor="29, 78, 216" particleCount={20}>
          <EventCalendar
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            events={events}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setShowAddForm={setShowAddForm}
          />
        </ParticleCard>
      </div>

      {/* Event Modal */}
      {showAddForm && selectedDate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {months[currentDate.getMonth()]} {selectedDate}
              </h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              >✕</button>
            </div>

            {/* Existing Events */}
            <div className="mb-8">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                Scheduled Events
              </h4>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {events.filter(
                  (e) =>
                    e.date === selectedDate &&
                    e.month === currentDate.getMonth(),
                ).length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No events scheduled.</p>
                ) : (
                  events
                    .filter(
                      (e) =>
                        e.date === selectedDate &&
                        e.month === currentDate.getMonth(),
                    )
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border-l-4 border-blue-600 group"
                      >
                        <span className="text-sm font-bold text-slate-700">
                          {event.title}
                        </span>
                        <button
                          onClick={() => {
                            setEvents(
                              events.filter((e) => e.id !== event.id),
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Add Event Section */}
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Quick Add
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter event title..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                />
                <button
                  onClick={() => {
                    if (eventTitle.trim()) {
                      setEvents([
                        ...events,
                        {
                          id: Date.now(),
                          date: selectedDate,
                          month: currentDate.getMonth(),
                          year: currentDate.getFullYear(),
                          title: eventTitle,
                        },
                      ]);
                      setEventTitle("");
                    }
                  }}
                  className="bg-blue-600 text-white px-6 rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <ParticleCard glowColor="59, 130, 246" particleCount={8}>
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 group">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-blue-600 transition-colors">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter group-hover:scale-105 transition-transform origin-left">{value}</p>
      </div>
    </ParticleCard>
  );
}

function EventCalendar({
  currentDate,
  setCurrentDate,
  events,
  selectedDate,
  setSelectedDate,
  setShowAddForm,
}) {
  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length < 42) days.push(null);

  const isEventDay = (day) =>
    events.some((e) => e.date === day && e.month === currentDate.getMonth());

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  }

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setShowAddForm(true);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
              )
            }
            className="p-3 hover:bg-blue-600 hover:text-white text-slate-400 rounded-2xl transition-all duration-300 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
              )
            }
            className="p-3 hover:bg-blue-600 hover:text-white text-slate-400 rounded-2xl transition-all duration-300 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-4">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-black text-blue-600 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => day && handleDateClick(day)}
            className={`aspect-square flex items-center justify-center rounded-2xl text-xs font-bold transition-all duration-300 transform active:scale-90 ${
              day === null
                ? "opacity-0 cursor-default"
                : isEventDay(day)
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50"
                  : isToday(day)
                    ? "bg-blue-50 text-blue-700 ring-2 ring-blue-200"
                    : "bg-slate-50 text-slate-600 hover:bg-white hover:shadow-lg hover:shadow-slate-100 hover:text-blue-600"
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
