import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight, Brain } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import toast from 'react-hot-toast';

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export function SignInCard2() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  // For 3D card effect - increased rotation range for more pronounced 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]); 
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const account = await login(email, password);
      toast.success('Welcome back!');
      navigate(`/${account.role}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setIsLoading(true);
    try {
      const account = await login(`${role}@edusense.com`, `${role}123`);
      toast.success(`Logged in as ${role}`);
      navigate(`/${account.role}`);
    } catch {
      toast.error('Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* Background gradient effect - matches the purple styling */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/40 via-blue-900/20 to-slate-950" />
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-cyan-600/10 blur-[80px]" />
      <motion.div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-cyan-500/10 blur-[60px]"
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />
      <motion.div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-orange-500/10 blur-[60px]"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1
        }}
      />

      {/* Animated glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-[100px] animate-pulse opacity-40" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-[100px] animate-pulse delay-1000 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div 
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(34,211,238,0.03)",
                  "0 0 15px 5px rgba(34,211,238,0.05)",
                  "0 0 10px 2px rgba(34,211,238,0.03)"
                ],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut", 
                repeatType: "mirror" 
              }}
            />

            {/* Traveling light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror" }
                }}
              />
              
              <motion.div 
                className="absolute right-0 bottom-0 h-[3px] w-[50%] bg-gradient-to-l from-transparent via-orange-400 to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  right: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 1.2 }
                }}
              />
            </div>

            {/* Glass card background */}
            <div className="relative bg-slate-950/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl overflow-hidden">
              
              {/* Logo and header */}
              <div className="text-center space-y-1 mb-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto w-12 h-12 rounded-full border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center relative overflow-hidden"
                >
                  <Brain className="w-6 h-6 text-cyan-400" />
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent opacity-50" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-slate-100 mt-2"
                >
                  EduSense AI
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400 text-xs"
                >
                  Sign in to your intelligent workspace
                </motion.p>
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div className="space-y-3">
                  {/* Email input */}
                  <motion.div 
                    className={`relative ${focusedInput === "email" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.01 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "email" ? 'text-cyan-400' : 'text-slate-500'
                      }`} />
                      
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-cyan-500/50 text-slate-100 placeholder:text-slate-500 h-11 transition-all duration-300 pl-10 pr-3 focus:bg-slate-900/80 focus:ring-1 focus:ring-cyan-500/30"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password input */}
                  <motion.div 
                    className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.01 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "password" ? 'text-cyan-400' : 'text-slate-500'
                      }`} />
                      
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-cyan-500/50 text-slate-100 placeholder:text-slate-500 h-11 transition-all duration-300 pl-10 pr-10 focus:bg-slate-900/80 focus:ring-1 focus:ring-cyan-500/30"
                        required
                      />
                      
                      <div 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 cursor-pointer"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                        ) : (
                          <EyeClosed className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex items-center">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="peer h-4 w-4 rounded border-slate-600 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 transition-all cursor-pointer"
                      />
                    </div>
                    <label htmlFor="remember-me" className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                      Remember me
                    </label>
                  </div>
                  
                  <div className="text-xs">
                    <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Sign in button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group/button mt-5 h-10 overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="button-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-1.5 text-sm"
                      >
                        Sign In
                        <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-1 transition-transform" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <div className="relative mt-4 mb-4 flex items-center">
                  <div className="flex-grow border-t border-slate-700/50"></div>
                  <span className="mx-3 text-[10px] uppercase tracking-wider text-slate-500 font-medium">Quick Demo</span>
                  <div className="flex-grow border-t border-slate-700/50"></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['admin', 'faculty', 'student'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleDemo(r)}
                      disabled={isLoading}
                      className="rounded-lg border border-slate-700/50 bg-slate-800/30 py-2 text-[11px] font-medium uppercase text-slate-300 hover:border-cyan-500/30 hover:bg-slate-800/70 hover:text-cyan-400 transition-all"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-slate-400 mt-5 pt-2 border-t border-slate-800/50">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
