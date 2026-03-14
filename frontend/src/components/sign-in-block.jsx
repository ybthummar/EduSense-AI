import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";

export function SignInBlock() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    console.log("Sign in with:", { email, password, rememberMe });
  };

  const handleGoogleSignIn = () => {
    console.log("Sign in with Google started");
  };

  const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 p-4 relative w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-zinc-950/90" />
      </div>
      <div className="absolute min-h-screen inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
           animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-hu-background/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -70, 0],
            y: [0, 70, 0],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-hu-background/20 rounded-full blur-[100px] mix-blend-screen"
        />
      </div>

       <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-md"
      >
        <Card className="min-w-fit w-[380px] bg-white/[0.02] border-white/[0.05] shadow-2xl backdrop-blur-3xl mx-auto">
          <CardHeader className="space-y-3 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-hu-background to-hu-background/50 flex items-center justify-center mb-2 shadow-lg shadow-hu-background/20 border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white">
              Welcome back
            </CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
               Please sign in to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
             <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-11 relative overflow-hidden group"
                onClick={handleGoogleSignIn}
              >
              <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <div className="flex items-center justify-center gap-3">
                <GoogleIcon />
                <span className="font-medium text-sm">Sign in with Google</span>
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-3 text-zinc-500 backdrop-blur-xl">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</Label>
                  <Input
                    className="h-11 bg-white/5 border-white/10 text-white hover:border-white/20 focus:border-hu-background focus:ring-1 focus:ring-hu-background focus:bg-white/10 transition-all duration-200 shadow-inner rounded-xl"
                    placeholder="name@example.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
               </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                     <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</Label>
                     <Link to="/forgot-password" className="text-xs text-hu-background hover:text-hu-background/80 hover:underline transition-colors font-medium">
                        Forgot password?
                     </Link>
                  </div>
                  <Input
                     className="h-11 bg-white/5 border-white/10 text-white hover:border-white/20 focus:border-hu-background focus:ring-1 focus:ring-hu-background focus:bg-white/10 transition-all duration-200 shadow-inner rounded-xl pr-10"
                     type="password"
                     placeholder="Enter your password"
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                   <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked)}
                      className="border-white/20 data-[state=checked]:bg-hu-background data-[state=checked]:border-hu-background"
                   />
                   <Label htmlFor="remember" className="text-sm font-medium leading-none text-zinc-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Remember me for 30 days
                   </Label>
                </div>

                <Button
                   type="submit"
                   isLoading={isSubmitting}
                   className="w-full h-11 bg-hu-background hover:bg-hu-background/90 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(235,94,40,0.3)] hover:shadow-[0_0_30px_rgba(235,94,40,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
                >
                   Sign In
                </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center text-sm pt-4 border-t border-white/5 pb-2">
             <span className="text-zinc-500">Don't have an account? </span>
             <Link to="/signup" className="ml-1 text-hu-background hover:text-hu-background/80 hover:underline font-semibold transition-colors">
                Sign up
             </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
