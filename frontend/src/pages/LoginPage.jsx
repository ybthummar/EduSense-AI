import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, Loader2, ArrowRight, CheckCircle2, User, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

const demoAccounts = [
  { label: 'Admin', email: 'admin@edusense.com', password: 'admin123', role: 'admin' },
  { label: 'Faculty', email: 'faculty@edusense.com', password: 'faculty123', role: 'faculty' },
];

const studentAccounts = [
  { label: 'Ishita (AIML)', email: '23aiml001', password: '23aiml001', dept: 'AIML', name: 'Ishita Soni' },
  { label: 'Meet (CE)', email: '23ce001', password: '23ce001', dept: 'CE', name: 'Meet Desai' },
  { label: 'Manav (EC)', email: '25ec001', password: '25ec001', dept: 'EC', name: 'Manav Sharma' },
  { label: 'Mahi (IT)', email: '23it002', password: '23it002', dept: 'IT', name: 'Mahi Reddy' },
  { label: 'Vaishnavi (ME)', email: '25me003', password: '25me003', dept: 'ME', name: 'Vaishnavi Reddy' },
];

const highlights = [
  'Track attendance, SGPA trends, and risk levels in one place.',
  'Get personalized study recommendations with AI support.',
  'View subject-wise marks and performance analytics.',
  '100K+ student records with real-time insights.',
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(`/${user.role}`);
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const account = await login(email, password);
      toast.success('Welcome back!');
      navigate(`/${account.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoading(true);
    try {
      const loggedIn = await login(account.email, account.password);
      toast.success(`Logged in as ${account.label}`);
      navigate(`/${loggedIn.role}`);
    } catch {
      toast.error('Demo login failed. Is the backend running?');
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
              <div className="absolute -left-8 top-14 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="absolute bottom-12 right-6 h-32 w-32 rounded-full bg-orange-400/15 blur-3xl" />

              <div className="relative">
                <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                  <Brain className="h-4 w-4" />
                  EduSense AI Platform
                </div>

                <h1 className="text-4xl font-semibold leading-tight text-slate-100">
                  Smarter student outcomes with <span className="gradient-text">actionable insights</span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
                  Access your intelligent campus dashboard to monitor performance, predict risk, and make faster academic decisions.
                </p>

                <div className="mt-8 space-y-3">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
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
                <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
                <p className="mt-1 text-sm text-slate-400">Sign in to continue your EduSense workspace.</p>
              </div>

              <div className="mb-7 hidden lg:block">
                <h2 className="text-2xl font-semibold text-slate-100">Sign in</h2>
                <p className="mt-1 text-sm text-slate-400">Use your account credentials to access the dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Username / Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Student ID or email"
                      required
                      className="glass-panel-soft w-full rounded-xl border border-slate-600/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      required
                      className="glass-panel-soft w-full rounded-xl border border-slate-600/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-orange-400 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:from-cyan-400 hover:to-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-700/70 pt-5">
                <p className="mb-3 text-center text-xs uppercase tracking-[0.12em] text-slate-500">Admin & Faculty Access</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.role}
                      onClick={() => handleDemo(account)}
                      disabled={loading}
                      className="rounded-xl border border-slate-600/75 bg-slate-800/55 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {account.label}
                    </button>
                  ))}
                </div>

                <p className="mb-3 text-center text-xs uppercase tracking-[0.12em] text-slate-500">
                  <GraduationCap className="inline h-3 w-3 mr-1" />Student Demo Accounts
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {studentAccounts.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => handleDemo(account)}
                      disabled={loading}
                      className="group rounded-xl border border-slate-600/75 bg-slate-800/55 px-2 py-2.5 text-xs transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-200">{account.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{account.email.toUpperCase()}</div>
                      <div className="text-[10px] text-slate-500">{account.dept}</div>
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200">
                  Sign up
                </Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}