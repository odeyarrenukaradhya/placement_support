"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import TextType from "@/components/TextType";
import ParticleCard from "@/components/ParticleCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Bell, Megaphone, User, X } from "lucide-react";

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
  const [circulars, setCirculars] = useState([]);
  const [selectedCircular, setSelectedCircular] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Events from Backend
  const fetchEvents = async () => {
    try {
      const data = await apiFetch("/events");
      // Map API data to UI format
      const mapped = data.map((ev) => ({
        id: ev.id,
        date: parseInt(ev.event_date.split("-")[2]),
        month: parseInt(ev.event_date.split("-")[1]) - 1,
        year: parseInt(ev.event_date.split("-")[0]),
        title: ev.title,
        visibility: ev.visibility,
        isOwner: ev.is_owner,
      }));
      setEvents(mapped);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  // Combine and fetch all dashboard data
  useEffect(() => {
    let mounted = true;

    async function loadAllData() {
      // Small delay to ensure localStorage token is available after reload
      if (!mounted) return;

      const token = sessionStorage.getItem("token");
      if (!token) return; // DashboardLayout will handle the redirect

      try {
        setLoading(true);
        // Execute all API calls in parallel
        const [statsData, scoresData, eventsData, circularsData] = await Promise.all([
          apiFetch("/analytics/student/dashboard-stats").catch(err => { console.error("Stats fetch failed:", err); return {}; }),
          apiFetch("/analytics/student/my-scores").catch(err => { console.error("Scores fetch failed:", err); return []; }),
          apiFetch("/events").catch(err => { console.error("Events fetch failed:", err); return []; }),
          apiFetch("/circulars").catch(err => { console.error("Circulars fetch failed:", err); return []; })
        ]);

        if (!mounted) return;

        setCirculars(circularsData || []);

        // 1. Process Stats
        const upcoming = statsData?.upcoming_exams ?? 0;
        const completed = statsData?.completed_attempts ?? 0;

        const testAccuracies = (scoresData || []).map(s => {
          const total = Number(s.total_questions) || 0;
          const score = Number(s.score) || 0;
          return total > 0 ? (score / total) * 100 : 0;
        });

        const avgAccuracy = testAccuracies.length
          ? Math.round(testAccuracies.reduce((a, b) => a + b, 0) / testAccuracies.length)
          : 0;

        setStats({
          totalTests: upcoming + completed,
          completedTests: completed,
          availableTests: upcoming,
          averageScore: avgAccuracy,
        });

        // 2. Process Course Activity
        const activity = (scoresData || []).map((s, i) => {
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

        // 3. Process Events
        const mappedEvents = (eventsData || []).map((ev) => ({
          id: ev.id,
          date: parseInt(ev.event_date.split("-")[2]),
          month: parseInt(ev.event_date.split("-")[1]) - 1,
          year: parseInt(ev.event_date.split("-")[0]),
          title: ev.title,
          visibility: ev.visibility,
          isOwner: ev.is_owner,
        }));
        setEvents(mappedEvents);

      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAllData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Total Test" value={stats.totalTests} />
        <StatCard title="Completed Test" value={stats.completedTests} />
        <StatCard title="Available Tests" value={stats.availableTests} />
        <StatCard
          title="Average Score"
          value={stats.averageScore ? `${stats.averageScore}%` : "0%"}
        />
      </div>

      {/* Courses and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-4 border-slate-100 flex flex-col h-[360px] transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1">
          <h2 className="text-lg font-black mb-4 text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            Performance Analytics
          </h2>

          {/* Line Chart Container */}
          <div className="flex gap-2 flex-1 relative min-h-0">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between items-end pr-2 h-full text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
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
                      strokeWidth="1.5"
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
                        strokeWidth="1.5"
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
        <ParticleCard glowColor="29, 78, 216" particleCount={20} className="transition-all duration-300 hover:-translate-y-1">
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

      {/* Circular Notifications Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6 px-2">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Recent Circulars
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 ml-4">Important updates from TPO office</p>
          </div>
        </div>

        {circulars.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
              <Megaphone size={24} />
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No recent circulars</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circulars.slice(0, 3).map((circular) => (
              <ParticleCard key={circular.id} glowColor="59, 130, 246" particleCount={5} className="transition-all duration-300 hover:-translate-y-1">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-4 border-slate-50 transition-all duration-300 flex flex-col h-full group hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Megaphone size={18} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {new Date(circular.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                    {circular.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                    {circular.content}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <User size={12} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{circular.creator_name || 'TPO Office'}</span>
                    </div>
                    <button
                      onClick={() => setSelectedCircular(circular)}
                      className="text-xs font-black text-blue-600 uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                      Read More →
                    </button>
                  </div>
                </div>
              </ParticleCard>
            ))}
          </div>
        )}
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
                        className={`flex items-center justify-between p-4 rounded-2xl border-l-4 group ${event.visibility === 'everyone'
                          ? 'bg-blue-50/50 border-blue-600'
                          : 'bg-indigo-50/50 border-indigo-600'
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                            {event.title}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {event.visibility === 'everyone' ? 'TPO Event' : 'Personal'}
                          </span>
                        </div>
                        {event.isOwner && (
                          <button
                            onClick={async () => {
                              try {
                                await apiFetch(`/events/${event.id}`, { method: 'DELETE' });
                                setEvents(events.filter((e) => e.id !== event.id));
                              } catch (err) {
                                console.error("Delete failed:", err);
                              }
                            }}
                            className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                          >
                            Delete
                          </button>
                        )}
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
                  className="flex-1 text-slate-900 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                />
                <button
                  onClick={async () => {
                    if (eventTitle.trim()) {
                      try {
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
                        const saved = await apiFetch("/events", {
                          method: "POST",
                          body: JSON.stringify({
                            title: eventTitle,
                            type: 'other',
                            date: dateStr,
                            visibility: 'private',
                          }),
                        });

                        setEvents([
                          ...events,
                          {
                            id: saved.id,
                            date: selectedDate,
                            month: currentDate.getMonth(),
                            year: currentDate.getFullYear(),
                            title: eventTitle,
                            visibility: 'private',
                            isOwner: true,
                          },
                        ]);
                        setEventTitle("");
                      } catch (err) {
                        console.error("Save failed:", err);
                      }
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

      {/* Circular Detail Modal */}
      {selectedCircular && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-hidden flex flex-col relative">
            <button
              onClick={() => setSelectedCircular(null)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Megaphone size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {selectedCircular.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    {new Date(selectedCircular.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    By {selectedCircular.creator_name || 'TPO Office'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar lg:pr-4">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 text-lg font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedCircular.content}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCircular(null)}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <ParticleCard glowColor="59, 130, 246" particleCount={8} className="transition-all duration-300 hover:-translate-y-1">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border-4 border-slate-50 transition-all duration-300 group hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200">
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
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-4 border-slate-100 h-[360px] flex flex-col transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
              )
            }
            className="p-3 hover:bg-blue-600 hover:text-white text-slate-400 rounded-2xl transition-all duration-300 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-[10px]">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-black text-blue-600 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid grid grid-cols-7 gap-2 flex-1">
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => day && handleDateClick(day)}
            className={`flex items-center justify-center rounded-2xl text-xs font-bold transition-all duration-300 transform active:scale-90 ${day === null
              ? "opacity-0 cursor-default"
              : isEventDay(day)
                ? events.some(e => e.date === day && e.month === currentDate.getMonth() && e.visibility === 'everyone')
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50"
                  : "bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50"
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
