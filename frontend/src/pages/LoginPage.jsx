import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Sparkles, GraduationCap, Shield, Brain, TrendingUp, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Demo accounts for testing
  const demoAccounts = [
    { role: 'Admin', email: 'admin@edusense.com', password: 'admin123', icon: Shield, color: 'from-violet-500 to-purple-600' },
    { role: 'Faculty', email: 'faculty@edusense.com', password: 'faculty123', icon: Brain, color: 'from-primary-500 to-primary-600' },
    { role: 'Student', email: 'student@edusense.com', password: 'student123', icon: GraduationCap, color: 'from-accent-500 to-accent-600' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)

    // Demo mode: simulate login
    const demo = demoAccounts.find(d => d.email === email && d.password === password)
    if (demo) {
      const userData = {
        id: demo.role === 'Admin' ? 1 : demo.role === 'Faculty' ? 2 : 3,
        name: `${demo.role} User`,
        email: demo.email,
        role: demo.role.toLowerCase(),
        department: demo.role === 'Faculty' ? 'Computer Science' : undefined,
      }
      localStorage.setItem('edusense_token', 'demo_token_' + demo.role.toLowerCase())
      localStorage.setItem('edusense_user', JSON.stringify(userData))
      toast.success(`Welcome back, ${userData.name}!`)
      setTimeout(() => {
        window.location.href = `/${userData.role}`
      }, 500)
      return
    }

    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      toast.success('Welcome back!')
      navigate(`/${result.user.role}`)
    } else {
      toast.error(result.error)
    }
  }

  const fillDemo = (account) => {
    setEmail(account.email)
    setPassword(account.password)
  }

  return (
    <div className="min-h-screen bg-surface-950 flex relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-500/[0.07] rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-500/[0.05] rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-purple-500/[0.04] rounded-full blur-[80px] animate-blob" style={{ animationDelay: '4s' }} />

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/80 via-surface-950/50 to-accent-950/40" />

        {/* Floating decorative elements */}
        <div className="absolute top-[15%] right-[10%] w-20 h-20 rounded-2xl border border-primary-500/10 bg-primary-500/5 animate-float-slow rotate-12" />
        <div className="absolute bottom-[20%] left-[8%] w-16 h-16 rounded-xl border border-accent-500/10 bg-accent-500/5 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] right-[25%] w-12 h-12 rounded-lg border border-purple-500/10 bg-purple-500/5 animate-float-slow" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
          <div className="flex items-center gap-3 mb-10 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-xl shadow-primary-500/25">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">EduSense AI</h1>
              <p className="text-xs text-surface-500 font-medium tracking-wide">Academic Intelligence Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold text-surface-100 mb-5 leading-[1.15] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Unlock the power of<br />
            <span className="gradient-text-accent">AI-driven education</span>
          </h2>
          <p className="text-surface-400 text-lg mb-12 max-w-md leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Transform academic data into actionable insights with intelligent analytics, risk prediction, and personalized learning.
          </p>

          <div className="space-y-3.5">
            {[
              { text: 'Real-time student performance analytics', icon: BarChart3 },
              { text: 'AI-powered academic risk prediction', icon: Shield },
              { text: 'Personalized learning recommendations', icon: Brain },
              { text: 'RAG-enabled intelligent tutoring system', icon: Sparkles },
            ].map((feature, i) => {
              const FeatureIcon = feature.icon || Sparkles
              return (
                <div key={i} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <FeatureIcon className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-surface-300 text-sm font-medium">{feature.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center animate-fade-in-up">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">EduSense AI</h1>
          </div>

          <div className="glass-card p-7 sm:p-8 glow-ring animate-scale-in">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-surface-100">Welcome back</h2>
              <p className="text-surface-400 mt-1.5 text-sm">Sign in to your EduSense AI account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@university.edu"
                  id="login-email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-surface-300">Password</label>
                  <span className="text-xs text-primary-400 hover:text-primary-300 cursor-pointer font-medium">Forgot password?</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                id="login-submit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-surface-500 text-sm">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign up</Link>
              </p>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="mt-5 glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-[10px] text-surface-500 font-semibold uppercase tracking-widest mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((account) => {
                const AccIcon = account.icon
                return (
                  <button
                    key={account.role}
                    onClick={() => fillDemo(account)}
                    className="group flex flex-col items-center gap-2 px-3 py-3 bg-surface-800/40 hover:bg-surface-800/70 border border-surface-700/20 hover:border-primary-500/20 rounded-xl text-xs font-medium text-surface-300 hover:text-surface-100 transition-all cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center shadow-lg opacity-70 group-hover:opacity-100 transition-opacity`}>
                      <AccIcon className="w-4 h-4 text-white" />
                    </div>
                    {account.role}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
