'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Modal from '@/components/Modal';

export default function NewExamPage() {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [duration, setDuration] = useState(30);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correct_answer: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct_answer: '' }]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Check if every question has a correct answer selected
    const missingAnswers = questions.some(q => !q.correct_answer);
    if (missingAnswers) {
      setErrorModal({
        isOpen: true,
        title: 'Validation Error',
        message: "Some questions do not have a correct answer selected. Please select a correct answer for each question (shown in red if missing)."
      });
      return;
    }

    setLoading(true);

    try {
      const exam = await apiFetch('/exams', {
        method: 'POST',
        body: JSON.stringify({ title, duration, code }),
      });

      await apiFetch(`/exams/${exam.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({ questions }),
      });

      router.push('/dashboard/exams');
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: 'Creation Failed',
        message: err.message || 'Failed to create exam'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-8 text-blue-900">Create Placement Exam</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Exam Title</label>
              <input
                type="text"
                required
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:ring-0 transition-all outline-none"
                placeholder="e.g. TCS Ninja Test"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Exam Code (6 Digits)</label>
              <input
                type="text"
                required
                maxLength="6"
                pattern="\d{6}"
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:ring-0 transition-all outline-none"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Duration (mins)</label>
              <input
                type="number"
                required
                min="1"
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:ring-0 transition-all outline-none"
                value={duration || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDuration(isNaN(val) ? 0 : val);
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Exam Content</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold shadow-sm hover:shadow-md border border-blue-200 transition-all"
            >
              + Add Question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 space-y-6 text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h4 className="font-bold text-blue-600 uppercase tracking-widest text-sm">Question {qIndex + 1}</h4>
                {questions.length > 1 && (
                    <button 
                        type="button" 
                        onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                        className="text-red-400 hover:text-red-600 text-xs font-bold uppercase"
                    >
                        Remove
                    </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Question Text</label>
                <textarea
                  required
                  className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-4 focus:border-blue-400 transition-all outline-none"
                  rows="3"
                  placeholder="Enter the question here..."
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter ml-1">Option {oIndex + 1}</label>
                    <input
                      type="text"
                      required
                      className="w-full border-b-2 border-slate-100 py-2 focus:border-blue-400 transition-all outline-none bg-transparent"
                      placeholder={`Choice ${oIndex + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-600">Select Correct Answer</label>
                  {!q.correct_answer && (
                    <span className="text-red-500 text-xs font-bold animate-pulse">Required: Please select one option below</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {q.options.map((opt, oIndex) => (
                    opt && (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => updateQuestion(qIndex, 'correct_answer', opt)}
                        className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                          q.correct_answer === opt 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-200'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 text-white font-black py-4 rounded-2xl hover:bg-blue-800 shadow-xl hover:shadow-2xl disabled:opacity-50 transition-all transform hover:-translate-y-1 active:translate-y-0 text-xl tracking-widest uppercase"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Finalizing...
            </span>
          ) : 'Publish Exam Now'}
        </button>
      </form>

      <Modal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        type="danger"
        confirmText="Understood"
        showCancel={false}
      />
    </div>
  );
}
