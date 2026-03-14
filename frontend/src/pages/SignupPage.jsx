import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, UserPlus, GraduationCap, BookOpen, Sparkles, Bot } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) return toast.error('All fields are required')
    if (password !== confirmPassword) return toast.error('Passwords do not match')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')

    setLoading(true)
    const result = await signup(name, email, password)
    setLoading(false)
    if (result.success) {
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-accent-500/[0.06] rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-primary-500/[0.05] rounded-full blur-[100px] animate-blob" style={{ animationDelay: '3s' }} />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent-950/80 via-surface-950/50 to-primary-950/40" />

        {/* Floating decorative elements */}
        <div className="absolute top-[20%] right-[15%] w-16 h-16 rounded-xl border border-accent-500/10 bg-accent-500/5 animate-float rotate-6" />
        <div className="absolute bottom-[25%] left-[10%] w-20 h-20 rounded-2xl border border-primary-500/10 bg-primary-500/5 animate-float-slow" style={{ animationDelay: '2s' }} />

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
            Start your journey with<br />
            <span className="gradient-text-accent">intelligent learning</span>
          </h2>
          <p className="text-surface-400 text-lg max-w-md leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Join thousands of students leveraging AI to boost academic performance and unlock personalized study paths.
          </p>

          <div className="mt-10 space-y-3.5">
            {[
              { text: 'AI-powered personalized study plans', icon: Sparkles },
              { text: 'Track your academic progress in real-time', icon: BookOpen },
              { text: 'Chat with an intelligent learning assistant', icon: Bot },
            ].map((feature, i) => {
              const FeatureIcon = feature.icon
              return (
                <div key={i} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                  <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/10 flex items-center justify-center flex-shrink-0">
                    <FeatureIcon className="w-4 h-4 text-accent-400" />
                  </div>
                  <span className="text-surface-300 text-sm font-medium">{feature.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center animate-fade-in-up">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">EduSense AI</h1>
          </div>

          <div className="glass-card p-7 sm:p-8 glow-ring animate-scale-in">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-surface-100 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-500/10">
                  <UserPlus className="w-5 h-5 text-primary-400" />
                </div>
                Create account
              </h2>
              <p className="text-surface-400 mt-2 text-sm">Sign up as a student to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="John Doe"
                  id="signup-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@university.edu"
                  id="signup-email"
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
                    id="signup-password"
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
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  id="signup-confirm-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-[15px] disabled:opacity-50 mt-2"
                id="signup-submit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-surface-500 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign in</Link>
              </p>
            </div>

            <div className="mt-4 p-3.5 bg-surface-800/30 rounded-xl border border-surface-700/20">
              <p className="text-xs text-surface-500 text-center">
                <strong className="text-surface-400">Note:</strong> Faculty accounts are created by Admin only. Students can self-register.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
