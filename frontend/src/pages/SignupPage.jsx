import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react'
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
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-900/40 via-surface-950 to-primary-900/20" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px]" />

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
            Start your journey with<br />
            <span className="gradient-text">intelligent learning</span>
          </h2>
          <p className="text-surface-400 text-lg max-w-md">
            Join thousands of students leveraging AI to boost academic performance and unlock personalized study paths.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">EduSense AI</h1>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-surface-100 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary-400" /> Create account
              </h2>
              <p className="text-surface-400 mt-1">Sign up as a student to get started</p>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 cursor-pointer"
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
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
              </p>
            </div>

            <div className="mt-4 p-3 bg-surface-800/40 rounded-lg border border-surface-700/30">
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
