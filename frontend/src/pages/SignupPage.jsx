import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, User, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const benefits = [
  'Personalized recommendations for each student profile.',
  'Visual analytics for grades, attendance, and engagement.',
  'Role-based dashboards for Admin, Faculty, and Students.',
];

export default function SignupPage() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(`/${user.role}`);
    return null;
  }

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="animate-rise-in relative z-10 w-full max-w-5xl">
        <div className="app-shell overflow-hidden rounded-3xl">
          <div className="grid lg:grid-cols-2">
            <section className="relative hidden border-r border-slate-700/70 px-10 py-12 lg:block">
              <div className="absolute left-2 top-16 h-36 w-36 rounded-full bg-cyan-400/16 blur-3xl" />
              <div className="absolute bottom-10 right-6 h-40 w-40 rounded-full bg-orange-400/14 blur-3xl" />

              <div className="relative">
                <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-orange-300/25 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">
                  <Sparkles className="h-4 w-4" />
                  Join EduSense AI
                </div>

                <h1 className="text-4xl font-semibold leading-tight text-slate-100">
                  Start building <span className="gradient-text">predictive academic workflows</span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
                  Create your workspace and turn raw educational data into clear decisions, faster interventions, and better student outcomes.
                </p>

                <div className="mt-8 space-y-3">
                  {benefits.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <div className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-12">
              <div className="mb-7 lg:hidden">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-orange-400 text-slate-950">
                  <Brain className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-100">Create account</h1>
                <p className="mt-1 text-sm text-slate-400">Set up your EduSense profile in a minute.</p>
              </div>

              <div className="mb-7 hidden lg:block">
                <h2 className="text-2xl font-semibold text-slate-100">Create account</h2>
                <p className="mt-1 text-sm text-slate-400">Start with basic credentials and sign in immediately.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="John Doe"
                      required
                      className="glass-panel-soft w-full rounded-xl border border-slate-600/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="you@example.com"
                      required
                      className="glass-panel-soft w-full rounded-xl border border-slate-600/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={form.password}
                        onChange={update('password')}
                        placeholder="Min 6 chars"
                        required
                        className="glass-panel-soft w-full rounded-xl border border-slate-600/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={update('confirmPassword')}
                        placeholder="Repeat password"
                        required
                        className="glass-panel-soft w-full rounded-xl border border-slate-600/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-orange-400 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:from-cyan-400 hover:to-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200">
                  Sign in
                </Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}