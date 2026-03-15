import { useState, useEffect, useMemo } from 'react';
import { Plus, Trophy, Clock, BookOpen, Users, CheckCircle, Calendar, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
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

export default function FacultyQuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: '', subject: '', scheduled_date: '', duration_minutes: 30,
    questions: [{ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }],
  });
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quizRes, resultRes] = await Promise.all([
        quizAPI.list(),
        quizAPI.getResults(),
      ]);
      setQuizzes(quizRes.data || []);
      setResults(resultRes.data || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Group results by quiz_id
  const resultsByQuiz = useMemo(() => {
    const map = {};
    results.forEach(r => {
      const qid = r.quiz_id;
      if (!map[qid]) map[qid] = [];
      map[qid].push(r);
    });
    return map;
  }, [results]);

  const stats = useMemo(() => ({
    total: quizzes.length,
    scheduled: quizzes.filter(q => q.status === 'scheduled').length,
    active: quizzes.filter(q => q.status === 'active').length,
    completed: quizzes.filter(q => q.status === 'completed').length,
    totalAttempts: results.length,
    avgScore: results.length > 0 ? (results.reduce((s, r) => s + (r.score || 0), 0) / results.length).toFixed(1) : '0',
  }), [quizzes, results]);

  const addQuestion = () => {
    setForm(f => ({
      ...f,
      questions: [...f.questions, { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }],
    }));
  };

  const removeQuestion = (idx) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };

  const updateQuestion = (idx, field, value) => {
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || form.questions.some(q => !q.question_text || !q.option_a || !q.option_b)) {
      toast.error('Fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      await quizAPI.create({
        ...form,
        faculty_id: user?.faculty_id || user?.id || '',
        faculty_name: user?.name || '',
        status: 'scheduled',
      });
      toast.success('Quiz scheduled successfully');
      setShowCreate(false);
      setForm({ title: '', subject: '', scheduled_date: '', duration_minutes: 30, questions: [{ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }] });
      loadData();
    } catch (err) {
      toast.error('Failed to create quiz');
    } finally {
      setCreating(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await quizAPI.seed();
      toast.success(res.data?.message || 'Quizzes seeded');
      loadData();
    } catch (err) {
      toast.error('Failed to seed quizzes');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Quiz Management</h1>
          <p className="text-sm text-slate-400 mt-1">Schedule, manage, and track student quiz performance</p>
        </div>
        <div className="flex gap-3">
          {quizzes.length === 0 && (
            <Button variant="outline" onClick={handleSeed} loading={seeding}>
              Seed Demo Quizzes
            </Button>
          )}
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Schedule Quiz
          </Button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Quizzes', value: stats.total, icon: BookOpen, color: 'text-cyan-400' },
          { label: 'Scheduled', value: stats.scheduled, icon: Calendar, color: 'text-amber-400' },
          { label: 'Active', value: stats.active, icon: Clock, color: 'text-blue-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Attempts', value: stats.totalAttempts, icon: Users, color: 'text-purple-400' },
          { label: 'Avg Score', value: `${stats.avgScore}%`, icon: Trophy, color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Quiz List */}
      <Card>
        <CardHeader>
          <CardTitle>All Quizzes</CardTitle>
          <CardDescription>Click a quiz to view student scores</CardDescription>
        </CardHeader>
        <div className="space-y-2 p-2">
          {quizzes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No quizzes yet. Schedule one or seed demo data.</p>
          ) : (
            quizzes.map(quiz => {
              const attempts = resultsByQuiz[quiz.id] || [];
              const avgScore = attempts.length > 0
                ? (attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length).toFixed(1)
                : null;
              const isExpanded = expandedQuiz === quiz.id;
              const st = STATUS_STYLES[quiz.status] || STATUS_STYLES.scheduled;

              return (
                <div key={quiz.id} className="rounded-xl border border-slate-700/50 bg-slate-800/20 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
                    onClick={() => setExpandedQuiz(isExpanded ? null : quiz.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/20">
                        <Trophy className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">{quiz.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>{quiz.subject}</span>
                          {quiz.faculty_name && <span>&bull; {quiz.faculty_name}</span>}
                          {quiz.scheduled_date && <span>&bull; {quiz.scheduled_date}</span>}
                          {quiz.duration_minutes && <span>&bull; {quiz.duration_minutes} min</span>}
                          <span>&bull; {quiz.question_count || 0} Q</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {attempts.length > 0 && (
                        <span className="text-xs text-slate-400">{attempts.length} attempts</span>
                      )}
                      {avgScore !== null && (
                        <span className={`text-sm font-bold ${parseFloat(avgScore) >= 70 ? 'text-green-400' : parseFloat(avgScore) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {avgScore}%
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-700/30 p-4 bg-slate-900/30">
                      {attempts.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No student attempts yet</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-700/50">
                                <th className="px-3 py-2 text-left text-slate-400 font-medium">Student ID</th>
                                <th className="px-3 py-2 text-right text-slate-400 font-medium">Score</th>
                                <th className="px-3 py-2 text-right text-slate-400 font-medium">Correct</th>
                                <th className="px-3 py-2 text-right text-slate-400 font-medium">Total</th>
                                <th className="px-3 py-2 text-right text-slate-400 font-medium">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attempts.map((att, i) => (
                                <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                                  <td className="px-3 py-2 text-cyan-400 font-mono">{att.student_id}</td>
                                  <td className="px-3 py-2 text-right">
                                    <span className={`font-bold ${att.score >= 70 ? 'text-green-400' : att.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                      {att.score}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right text-slate-300">{att.correct_answers}</td>
                                  <td className="px-3 py-2 text-right text-slate-300">{att.total_questions}</td>
                                  <td className="px-3 py-2 text-right text-slate-500 text-xs">
                                    {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Create Quiz Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto surface-card rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100">Schedule New Quiz</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Quiz Title *</label>
                  <input
                    type="text" required value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                    placeholder="e.g., Data Structures Quiz 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Subject *</label>
                  <input
                    type="text" required value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                    placeholder="e.g., Data Structures"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Scheduled Date</label>
                  <input
                    type="date" value={form.scheduled_date}
                    onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duration (minutes)</label>
                  <input
                    type="number" value={form.duration_minutes} min={5} max={180}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 30 }))}
                    className="w-full rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Questions ({form.questions.length})</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="h-3 w-3" /> Add Question
                  </Button>
                </div>

                {form.questions.map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400">Q{idx + 1}</span>
                      {form.questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(idx)} className="text-slate-500 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text" required value={q.question_text} placeholder="Enter question"
                      onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                      className="w-full rounded-lg border border-slate-600/70 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                          <input
                            type="radio" name={`correct-${idx}`} value={opt}
                            checked={q.correct_option === opt}
                            onChange={() => updateQuestion(idx, 'correct_option', opt)}
                            className="accent-cyan-400"
                          />
                          <input
                            type="text" required={opt === 'A' || opt === 'B'} value={q[`option_${opt.toLowerCase()}`]}
                            placeholder={`Option ${opt}`}
                            onChange={e => updateQuestion(idx, `option_${opt.toLowerCase()}`, e.target.value)}
                            className="flex-1 rounded-lg border border-slate-600/70 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" loading={creating}>
                  <Calendar className="h-4 w-4" /> Schedule Quiz
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
