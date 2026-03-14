import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
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
    { role: 'Admin', email: 'admin@edusense.com', password: 'admin123' },
    { role: 'Faculty', email: 'faculty@edusense.com', password: 'faculty123' },
    { role: 'Student', email: 'student@edusense.com', password: 'student123' },
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
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-surface-950 to-accent-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">EduSense AI</h1>
              <p className="text-sm text-surface-500">Academic Intelligence Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-surface-100 mb-4 leading-tight">
            Unlock the power of<br />
            <span className="gradient-text">AI-driven education</span>
          </h2>
          <p className="text-surface-400 text-lg mb-12 max-w-md">
            Transform academic data into actionable insights with intelligent analytics, risk prediction, and personalized learning.
          </p>

          <div className="space-y-4">
            {[
              'Real-time student performance analytics',
              'AI-powered academic risk prediction',
              'Personalized learning recommendations',
              'RAG-enabled intelligent tutoring system',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-primary-400" />
                </div>
                <span className="text-surface-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">EduSense AI</h1>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-surface-100">Welcome back</h2>
              <p className="text-surface-400 mt-1">Sign in to your EduSense AI account</p>
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
                <label className="block text-sm font-medium text-surface-300 mb-2">Password</label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 cursor-pointer"
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
                <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">Sign up</Link>
              </p>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="mt-6 glass-card p-5">
            <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  onClick={() => fillDemo(account)}
                  className="px-3 py-2 bg-surface-800/60 hover:bg-surface-700/60 border border-surface-700/30 rounded-lg text-xs font-medium text-surface-300 hover:text-surface-100 transition-all cursor-pointer"
                >
                  {account.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
