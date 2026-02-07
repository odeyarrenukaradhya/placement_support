'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Clock, Shield, Send, ChevronRight, CheckCircle2, ChevronLeft, Layout, MousePointer2, AlertTriangle, XCircle, Info } from 'lucide-react';
import gsap from 'gsap';

export default function ExamAttemptPage() {
  const { id: examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [answerTimestamps, setAnswerTimestamps] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [copyViolations, setCopyViolations] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);
  const router = useRouter();
  
  const mainContentRef = useRef(null);
  const qCardRef = useRef(null);
  const questionStartTime = useRef(Date.now());
  const terminationRef = useRef(false);

  // Logging utility
  const logEvent = useCallback((type, metadata = {}) => {
    if (!attemptId) return;
    apiFetch('/integrity/log', {
      method: 'POST',
      body: JSON.stringify({ attempt_id: attemptId, type, metadata }),
    }).catch(console.error);
  }, [attemptId]);

  // Initialize Data
  useEffect(() => {
    const initExam = async () => {
      try {
        const [attemptRes, exams] = await Promise.all([
          apiFetch('/attempts/start', {
            method: 'POST',
            body: JSON.stringify({ exam_id: examId }),
          }),
          apiFetch('/exams'),
        ]);

        setAttemptId(attemptRes.attempt_id);
        const currentExam = exams.find(e => e.id === examId);
        if (!currentExam) throw new Error('Exam not found');
        
        const questionsData = await apiFetch(`/exams/${examId}/questions`).catch(() => []);
        
        setExam(currentExam);
        setQuestions(questionsData);
        
        const startTime = new Date(attemptRes.started_at).getTime();
        const durationMs = currentExam.duration * 60 * 1000;
        const endTime = startTime + durationMs;
        const remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        
        setTimeLeft(remainingSeconds);
      } catch (err) {
        console.error('Initialization error:', err);
        router.push('/dashboard/exams');
      } finally {
        setLoading(false);
      }
    };
    initExam();
  }, [examId, router]);

  // Entrance Animation
  useEffect(() => {
    if (!loading && exam) {
      gsap.fromTo(".nav-item", 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: "back.out(1.7)" }
      );
      gsap.fromTo(".q-container", 
        { x: 30, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [loading, exam]);

  // Question Switch Animation
  useEffect(() => {
    if (qCardRef.current) {
      gsap.fromTo(qCardRef.current, 
        { y: 10, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
    // Update timing ref when question changes
    questionStartTime.current = Date.now();
  }, [activeQuestion]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit(true);
      return;
    }
    if (timeLeft === null) return;
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Integrity Controls (Refined)
  useEffect(() => {
    if (!attemptId) return;

    // Use a small delay for blur to avoid false positives on quick interactions
    let blurTimeout;
    const handleBlur = () => {
      if (!hasStarted || isTerminated) return;
      blurTimeout = setTimeout(() => {
        logEvent('window_blur', { timestamp: new Date().toISOString() });
        setTabViolations(prev => {
          const next = prev + 1;
          if (next >= 5) triggerTermination('Too many tab switches/window blurs');
          return next;
        });
      }, 500); 
    };
    const handleFocus = () => clearTimeout(blurTimeout);

    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted && !isTerminated) {
        logEvent('tab_hidden', { timestamp: new Date().toISOString() });
        setTabViolations(prev => {
          const next = prev + 1;
          if (next >= 5) triggerTermination('Excessive tab switching detected');
          return next;
        });
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => {
      e.preventDefault();
      if (!hasStarted || isTerminated) return;
      setCopyViolations(prev => {
        const next = prev + 1;
        if (next >= 5) triggerTermination('Excessive copy attempts');
        return next;
      });
      logEvent('forbidden_copy', { count: copyViolations + 1 });
    };
    const handlePaste = (e) => {
      e.preventDefault();
      if (!hasStarted || isTerminated) return;
      setCopyViolations(prev => {
        const next = prev + 1;
        if (next >= 5) triggerTermination('Excessive paste attempts');
        return next;
      });
      logEvent('forbidden_paste', { count: copyViolations + 1 });
    };

    const handleKeyDown = (e) => {
      if (!hasStarted || isTerminated) return;
      if ((e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'p' || e.key === 'r')) || e.key === 'F5') {
        e.preventDefault();
        logEvent('forbidden_key_press', { key: e.key, timestamp: new Date().toISOString() });
        if (e.key === 'c' || e.key === 'v') {
          setCopyViolations(prev => {
            const next = prev + 1;
            if (next >= 5) triggerTermination('Illegal shortcut usage');
            return next;
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(blurTimeout);
    };
  }, [attemptId, logEvent, hasStarted, isTerminated, copyViolations]);

  const triggerTermination = (reason) => {
    if (terminationRef.current) return;
    terminationRef.current = true;
    
    setIsTerminated(true);
    logEvent('automatic_termination', { reason, timestamp: new Date().toISOString() });
    handleSubmit(true, reason);
  };

  const handleAnswer = (questionId, option) => {
    const now = Date.now();
    const timeSpentOnQuestion = (now - questionStartTime.current) / 1000; // in seconds
    
    setAnswers(prev => ({ ...prev, [questionId]: option }));

    // Integrity Check: Answering Speed Monitoring
    // Context-aware logic: distinguish between suspicious speed and last-minute panic
    if (timeSpentOnQuestion < 3 && timeLeft !== null) {
        if (timeLeft > 120) {
            // Main phase: Suspiciously fast (possibly copying or external aid)
            logEvent('suspicious_answering_speed', { 
                question_id: questionId, 
                duration_seconds: timeSpentOnQuestion.toFixed(2),
                phase: 'main_phase'
            });
        } else if (timeLeft <= 120 && timeLeft > 0) {
            // Panic phase: Legitimate rush to finish the exam
            logEvent('exam_panic_rush', { 
                question_id: questionId, 
                duration_seconds: timeSpentOnQuestion.toFixed(2),
                phase: 'last_minutes_rush'
            });
        }
    }

    setAnswerTimestamps(prev => {
        const newTimestamps = [...prev, { time: now }];
        const recent = newTimestamps.filter(t => now - t.time < 5000);
        if (recent.length >= 4) {
            logEvent('rapid_answering_streak', { count: recent.length, timestamp: new Date().toISOString() });
            return [];
        }
        return recent;
    });
  };

  const handleSubmit = async (auto = false, terminationReason = null) => {
    if (!attemptId || isSubmitting) return;
    if (!auto && !confirm('Are you sure you want to submit?')) return;
    
    setIsSubmitting(true);
    try {
      await apiFetch(`/exams/${examId}/attempt`, {
        method: 'POST',
        body: JSON.stringify({ 
          answers, 
          attempt_id: attemptId,
          is_termination: !!terminationReason,
          termination_reason: terminationReason
        }),
      });
      
      if (!terminationReason) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Submission technical error:', err);
      // Only reset isSubmitting if it wasn't a termination (which is permanent)
      if (!terminationReason) setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return (Object.keys(answers).length / questions.length) * 100;
  }, [answers, questions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Establishing Secure Interface</p>
      </div>
    );
  }

  const currentQ = questions[activeQuestion];

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans select-none overflow-hidden">
      {/* Top Bar */}
      <header className="h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-950 leading-tight">{exam?.title}</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Exam Session</p>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 w-64 hidden lg:block">
           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
           </div>
        </div>

        <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border font-mono font-black text-xl transition-all duration-500 ${
          timeLeft < 180 ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-800'
        }`}>
          <Clock size={20} className={timeLeft < 180 ? 'text-red-500' : 'text-slate-400'} />
          {formatTime(timeLeft)}
        </div>
      </header>

      <main className="flex-grow flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-100 p-8 flex flex-col overflow-y-auto hidden md:flex">
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Questions</h3>
            <div className="grid grid-cols-4 gap-3">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveQuestion(idx)}
                  className={`nav-item h-12 rounded-xl font-bold transition-all duration-300 ${
                    activeQuestion === idx 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-600/20' 
                    : answers[questions[idx].id] 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
          </div>
         </div>
        </aside>

        {/* Content Area */}
        <section className="flex-grow p-12 lg:p-20 overflow-y-auto q-container" ref={mainContentRef}>
          <div className="max-w-3xl mx-auto" ref={qCardRef}>
            <div className="mb-12">
              <span className="text-blue-600 font-black text-sm uppercase tracking-widest mb-4 block">Question {activeQuestion + 1} of {questions.length}</span>
              <h2 className="text-4xl font-bold text-slate-900 leading-tight italic">
                {currentQ?.question}
              </h2>
            </div>

            <div className="space-y-4">
              {currentQ?.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(currentQ.id, opt)}
                    className={`w-full flex items-center p-6 rounded-[2rem] border-2 text-left transition-all duration-300 group ${
                      isSelected 
                      ? 'bg-blue-50 border-blue-600 shadow-xl shadow-blue-600/5 ring-4 ring-blue-600/5' 
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center mr-6 transition-all duration-300 ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'bg-slate-50 border-slate-200 text-transparent'
                    }`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <span className={`text-xl font-bold transition-colors duration-300 ${
                      isSelected ? 'text-blue-950' : 'text-slate-600'
                    }`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-16">
               <button 
                  onClick={() => setActiveQuestion(prev => Math.max(0, prev - 1))}
                  disabled={activeQuestion === 0}
                  className="p-5 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-30 transition-all font-bold"
               >
                  <ChevronLeft size={24} />
               </button>

               {activeQuestion < questions.length - 1 ? (
                 <button 
                    onClick={() => setActiveQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-slate-950 text-white font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200"
                 >
                    Next Question
                    <ChevronRight size={20} />
                 </button>
               ) : (
                 <button 
                    onClick={() => {
                        if (Object.keys(answers).length < questions.length) {
                           if (!confirm(`Warning: ${questions.length - Object.keys(answers).length} questions unanswered. Submit anyway?`)) return;
                        }
                        handleSubmit(false);
                    }}
                    disabled={isSubmitting}
                    className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                 >
                    {isSubmitting ? 'Syncing...' : 'End Exam Session'}
                 </button>
               )}
            </div>
          </div>
        </section>
      </main>

      {/* Floating Navigator for mobile */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-slate-100 p-4 rounded-3xl shadow-2xl z-50 flex items-center justify-between gap-4">
         <div className="flex-grow overflow-x-auto flex gap-2 no-scrollbar px-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveQuestion(idx)}
                className={`flex-shrink-0 w-10 h-10 rounded-xl font-bold transition-all ${
                  activeQuestion === idx ? 'bg-blue-600 text-white' : answers[questions[idx].id] ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                }`}
              >
                {idx + 1}
              </button>
            ))}
         </div>
         <button 
           onClick={() => handleSubmit(false)}
           className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg ring-4 ring-blue-100"
         >
         </button>
      </div>
      {/* Violation Termination Overlay */}
      {isTerminated && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
                <XCircle size={48} />
             </div>
             <h2 className="text-3xl font-black text-slate-950 mb-4">Exam Terminated</h2>
             <p className="text-slate-500 font-medium leading-relaxed mb-10">
               Your session has been automatically submitted due to multiple integrity violations. The administration has been notified of this event.
             </p>
             <button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
             >
                Return to Dashboard
             </button>
          </div>
        </div>
      )}

      {/* Starting Disclaimer Portal */}
      {!hasStarted && !loading && (
        <div className="fixed inset-0 bg-white z-[150] flex items-center justify-center p-6">
           <div className="max-w-2xl w-full">
              <div className="mb-12">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8">
                  <Shield size={32} />
                </div>
                <h2 className="text-5xl font-black text-slate-950 tracking-tight mb-6">Integrity Protocol</h2>
                <div className="space-y-6">
                   <div className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="shrink-0 text-blue-600"><Info size={24} /></div>
                      <p className="text-slate-600 font-medium leading-relaxed">
                        This examination is strictly monitored. Any attempt to <span className="text-slate-950 font-bold">switch tabs</span> or <span className="text-slate-950 font-bold">copy/paste</span> content will be logged.
                      </p>
                   </div>
                   <div className="flex gap-4 p-6 bg-red-50/50 rounded-3xl border border-red-100">
                      <div className="shrink-0 text-red-600"><AlertTriangle size={24} /></div>
                      <p className="text-red-900 font-bold leading-relaxed">
                        Threshold Limit: 5 Violations. Exceeding this limit will result in immediate termination and automatic submission of your current progress.
                      </p>
                   </div>
                </div>
              </div>
              
              <button 
                onClick={() => setHasStarted(true)}
                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] text-xl font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Accept & Start Exam
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
