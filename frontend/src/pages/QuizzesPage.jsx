import { useState, useEffect, useMemo } from 'react';
import { Trophy, Clock, CheckCircle, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quizAPI } from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  scheduled: { variant: 'warning', label: 'Scheduled' },
  active: { variant: 'primary', label: 'Active' },
  completed: { variant: 'success', label: 'Completed' },
};

export default function QuizzesPage() {
  const { user } = useAuth();
  const studentId = user?.student_id || user?.id;

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz attempt state
  const [activeQuiz, setActiveQuiz] = useState(null); // full quiz detail
  const [answers, setAnswers] = useState({}); // { questionIndex: 'A' | 'B' | 'C' | 'D' }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // after submission

  const [tab, setTab] = useState('available'); // 'available' | 'history'

  const loadData = async () => {
    setLoading(true);
    try {
      const [quizRes, attRes] = await Promise.all([
        quizAPI.list(),
        studentId ? quizAPI.getAttempts(studentId) : Promise.resolve({ data: [] }),
      ]);
      setQuizzes(quizRes.data || []);
      setAttempts(attRes.data || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Which quizzes has this student already attempted?
  const attemptedQuizIds = useMemo(() => new Set(attempts.map(a => a.quiz_id)), [attempts]);

  const availableQuizzes = useMemo(
    () => quizzes.filter(q => q.status === 'active' || q.status === 'completed'),
    [quizzes]
  );

  const scheduledQuizzes = useMemo(
    () => quizzes.filter(q => q.status === 'scheduled'),
    [quizzes]
  );

  const startQuiz = async (quizId) => {
    try {
      const res = await quizAPI.get(quizId);
      setActiveQuiz(res.data);
      setAnswers({});
      setResult(null);
    } catch (err) {
      toast.error('Failed to load quiz');
    }
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    const questions = activeQuiz.questions || [];
    if (Object.keys(answers).length < questions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        quiz_id: activeQuiz.id,
        student_id: studentId,
        answers: questions.map((q, i) => ({
          question_id: q.id || String(i),
          selected_option: answers[i],
        })),
      };
      const res = await quizAPI.submit(payload);
      setResult(res.data);
      toast.success(`Score: ${res.data.score}%`);
      loadData(); // refresh attempts
    } catch (err) {
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const exitQuiz = () => {
    setActiveQuiz(null);
    setAnswers({});
    setResult(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // ── Active Quiz Attempt View ──
  if (activeQuiz) {
    const questions = activeQuiz.questions || [];
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={exitQuiz} className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{activeQuiz.title}</h1>
            <p className="text-sm text-slate-400">{activeQuiz.subject} &bull; {questions.length} questions{activeQuiz.duration_minutes ? ` \u00b7 ${activeQuiz.duration_minutes} min` : ''}</p>
          </div>
        </div>

        {result ? (
          /* ── Result View ── */
          <Card>
            <div className="p-8 text-center space-y-4">
              <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full ${result.score >= 70 ? 'bg-green-500/15 text-green-400' : result.score >= 50 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                <Trophy className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-100">{result.score}%</h2>
              <p className="text-slate-400">
                You answered {result.correct_answers} out of {result.total_questions} questions correctly
              </p>
              <Button onClick={exitQuiz}>Back to Quizzes</Button>
            </div>
          </Card>
        ) : (
          /* ── Questions ── */
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={idx}>
                <div className="p-5 space-y-3">
                  <p className="text-sm font-semibold text-slate-100">
                    <span className="text-cyan-400 mr-2">Q{idx + 1}.</span>
                    {q.question_text}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const text = q[`option_${opt.toLowerCase()}`];
                      if (!text) return null;
                      const selected = answers[idx] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers(a => ({ ...a, [idx]: opt }))}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
                            selected
                              ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                              : 'border-slate-700/50 bg-slate-800/20 text-slate-300 hover:border-slate-600 hover:bg-slate-800/40'
                          }`}
                        >
                          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            selected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            {opt}
                          </span>
                          {text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-slate-400">
                {Object.keys(answers).length} / {questions.length} answered
              </span>
              <Button onClick={handleSubmit} loading={submitting} disabled={Object.keys(answers).length < questions.length}>
                <CheckCircle className="h-4 w-4" /> Submit Quiz
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Quiz List View ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Quizzes</h1>
        <p className="text-sm text-slate-400 mt-1">Attempt quizzes and track your scores</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-800/40 p-1 w-fit">
        {[
          { key: 'available', label: 'Available', count: availableQuizzes.length },
          { key: 'upcoming', label: 'Upcoming', count: scheduledQuizzes.length },
          { key: 'history', label: 'My Attempts', count: attempts.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Available Quizzes */}
      {tab === 'available' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableQuizzes.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-slate-500">No available quizzes right now</p>
          ) : (
            availableQuizzes.map(quiz => {
              const attempted = attemptedQuizIds.has(quiz.id);
              const attempt = attempts.find(a => a.quiz_id === quiz.id);
              const st = STATUS_STYLES[quiz.status] || STATUS_STYLES.active;
              return (
                <div key={quiz.id} className="surface-card rounded-2xl p-5 space-y-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/20">
                      <BookOpen className="h-5 w-5 text-cyan-400" />
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-100">{quiz.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{quiz.subject}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      {quiz.question_count && <span>{quiz.question_count} questions</span>}
                      {quiz.duration_minutes && <span>&bull; {quiz.duration_minutes} min</span>}
                      {quiz.faculty_name && <span>&bull; {quiz.faculty_name}</span>}
                    </div>
                  </div>
                  {attempted ? (
                    <div className="flex items-center justify-between rounded-lg bg-green-500/10 border border-green-400/15 px-3 py-2">
                      <span className="text-xs text-green-400">Completed</span>
                      <span className="text-sm font-bold text-green-400">{attempt?.score}%</span>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => startQuiz(quiz.id)}>
                      Attempt Quiz
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Upcoming / Scheduled */}
      {tab === 'upcoming' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scheduledQuizzes.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-slate-500">No upcoming quizzes scheduled</p>
          ) : (
            scheduledQuizzes.map(quiz => (
              <div key={quiz.id} className="surface-card rounded-2xl p-5 space-y-3 opacity-80">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/20">
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <Badge variant="warning">Scheduled</Badge>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{quiz.title}</h3>
                <p className="text-xs text-slate-400">{quiz.subject}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {quiz.scheduled_date && <span>Date: {quiz.scheduled_date}</span>}
                  {quiz.duration_minutes && <span>&bull; {quiz.duration_minutes} min</span>}
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-400/15 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-amber-400">Not yet available</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Attempt History */}
      {tab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>My Attempts</CardTitle>
            <CardDescription>Your quiz attempt history and scores</CardDescription>
          </CardHeader>
          <div className="p-2">
            {attempts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">You have not attempted any quizzes yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Quiz</th>
                      <th className="px-3 py-2 text-left text-slate-400 font-medium">Subject</th>
                      <th className="px-3 py-2 text-right text-slate-400 font-medium">Score</th>
                      <th className="px-3 py-2 text-right text-slate-400 font-medium">Correct</th>
                      <th className="px-3 py-2 text-right text-slate-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((att, i) => (
                      <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 text-slate-200">{att.quiz_title || att.quiz_id}</td>
                        <td className="px-3 py-2.5 text-slate-400">{att.subject || '-'}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`font-bold ${att.score >= 70 ? 'text-green-400' : att.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {att.score}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-300">{att.correct_answers}/{att.total_questions}</td>
                        <td className="px-3 py-2.5 text-right text-slate-500 text-xs">
                          {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
