"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function EventCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventType, setNewEventType] = useState("exam");
    const [newEventTime, setNewEventTime] = useState("09:00");
    const [notifiedEvents, setNotifiedEvents] = useState(new Set());
    const [notification, setNotification] = useState(null);
    const [mounted, setMounted] = useState(false);
    // Handle Hydration - Set initial data only on client
    useEffect(() => {
        setMounted(true);
        fetchEvents();
        setCurrentDate(new Date());
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await apiFetch('/events');
            // Map backend fields to frontend expected ones
            const mapped = data.map(ev => ({
                id: ev.id,
                date: ev.event_date,
                title: ev.title,
                type: ev.type,
                time: ev.event_time
            }));
            setEvents(mapped);
        } catch (err) {
            console.error("Failed to fetch events", err);
        }
    };

    // Check for upcoming events every minute
    useEffect(() => {
        if (!mounted) return;

        const checkUpcomingEvents = () => {
            const now = new Date();
            events.forEach(event => {
                if (!event.time) return;

                // Construct date string safely
                const eventDateTime = new Date(`${event.date}T${event.time}`);

                if (isNaN(eventDateTime.getTime())) return; // invalid date check

                const timeDiff = eventDateTime - now;
                const hoursDiff = timeDiff / (1000 * 60 * 60);

                // Notify if event is between 2 and 3 hours away (and not passed)
                const eventKey = `${event.date}-${event.title}`;

                if (hoursDiff > 2 && hoursDiff <= 3 && !notifiedEvents.has(eventKey)) {
                    showNotification(`Reminder: "${event.title}" is starting in ~2 hours!`);
                    setNotifiedEvents(prev => {
                        const newSet = new Set(prev);
                        newSet.add(eventKey);
                        return newSet;
                    });
                }
            });
        };

        const interval = setInterval(checkUpcomingEvents, 60000); // Check every minute
        checkUpcomingEvents(); // Initial check

        return () => clearInterval(interval);
    }, [events, notifiedEvents, mounted]);

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const days = ["S", "M", "T", "W", "T", "F", "S"];

    // NOTE: The provided "Code Edit" snippet for PieChart seems to be out of context for this file.
    // Assuming the user intended to add a PieChart component elsewhere or this was a mistake.
    // The `formatDate` function below is already present and correct for YYYY-MM-DD.
    // The instruction "restrict past date selections" is already implemented in `handleDateClick`.

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (clickedDate < today) {
            showNotification("Cannot manage events for past dates");
            return;
        }

        const dateStr = formatDate(clickedDate);
        setSelectedDate(dateStr);
        setIsModalOpen(true);
    };

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 5000);
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;

        try {
            const newEvent = {
                title: newEventTitle,
                type: newEventType,
                date: selectedDate,
                time: newEventTime
            };

            const saved = await apiFetch('/events', {
                method: 'POST',
                body: JSON.stringify(newEvent)
            });

            setEvents([...events, {
                id: saved.id,
                date: saved.event_date,
                title: saved.title,
                type: saved.type,
                time: saved.event_time
            }]);

            let timeStr = "";
            try {
                timeStr = new Date(`2000-01-01T${newEventTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            } catch (err) {
                timeStr = newEventTime;
            }

            showNotification(`New Event Added at ${timeStr}`);

            setNewEventTitle("");
            setNewEventTime("09:00");
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to add event", err);
            showNotification("Failed to save event");
        }
    };

    const getEventsForDate = (day) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatDate(targetDate);
        return events.filter(e => e.date === dateStr);
    };

    const renderCalendarDays = () => {
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const calendarDays = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < startDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

        for (let i = 1; i <= totalDays; i++) {
            const isToday = isCurrentMonth && i === today.getDate();
            const dayEvents = getEventsForDate(i);
            const hasEvents = dayEvents.length > 0;
            const hasExam = dayEvents.some(e => e.type === 'exam');
            const hasInterview = dayEvents.some(e => e.type === 'interview');

            calendarDays.push(
                <div
                    key={i}
                    onClick={() => handleDateClick(i)}
                    className={`h-10 w-10 flex flex-col items-center justify-center rounded-xl text-sm font-bold cursor-pointer transition-all relative group
            ${isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200" : ""}
            ${hasEvents && !isToday ? "bg-blue-500 text-white shadow-md" : ""}
            ${!isToday && !hasEvents ? "text-slate-600 hover:bg-slate-100" : ""}
          `}
                >
                    {i}
                    <div className="flex gap-0.5 mt-0.5">
                        {hasExam && <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-blue-200'}`}></div>}
                        {hasInterview && <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-indigo-300' : 'bg-indigo-200'}`}></div>}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };

    const selectedDateEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

    if (!mounted) {
        return <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex items-center justify-center text-slate-400">Loading Calendar...</div>;
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden h-full flex flex-col">
            {/* Notification Toast */}
            {notification && (
                <div className="absolute top-4 left-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-4 fade-in duration-300 flex items-center justify-between">
                    <span className="text-sm font-medium">{notification}</span>
                    <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Manage Schedule</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {days.map((day, index) => (
                    <div key={index} className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 place-items-center mb-4 flex-1">
                {renderCalendarDays()}
            </div>

            {isModalOpen && (
                <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col p-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-slate-800">
                            Events for {selectedDate}
                        </h4>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-6 custom-scrollbar">
                        {selectedDateEvents.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No events for this day.
                            </div>
                        ) : (
                            selectedDateEvents.map((ev, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{ev.title}</span>
                                            {ev.time && <span className="text-[10px] font-bold text-slate-400">
                                                {/* Safe Time Render */}
                                                {(() => {
                                                    try {
                                                        return new Date(`2000-01-01T${ev.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                                                    } catch (e) {
                                                        return ev.time;
                                                    }
                                                })()}
                                            </span>}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded self-start">{ev.type}</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await apiFetch(`/events/${ev.id}`, { method: 'DELETE' });
                                                setEvents(events.filter(e => e.id !== ev.id));
                                                showNotification("Event Removed");
                                            } catch (err) {
                                                console.error("Failed to delete event", err);
                                                showNotification("Failed to remove event");
                                            }
                                        }}
                                        className="text-xs text-red-400 hover:text-red-600 px-2"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddEvent} className="mt-auto pt-6 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">New Event</label>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Event Title..."
                                className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <input
                                    type="time"
                                    className="w-1/3 p-3 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                />
                                <select
                                    className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newEventType}
                                    onChange={(e) => setNewEventType(e.target.value)}
                                >
                                    <option value="exam">Exam</option>
                                    <option value="interview">Interview</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={!newEventTitle.trim()}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Event
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
