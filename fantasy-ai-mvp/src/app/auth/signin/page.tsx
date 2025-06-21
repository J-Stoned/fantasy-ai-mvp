"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Brain, Mail, Lock, Eye, EyeOff, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "react-hot-toast";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        toast.success("Welcome back to Fantasy.AI!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-neon-blue/20 rounded-full border border-neon-blue/30">
                <Brain className="w-8 h-8 text-neon-blue" />
              </div>
              <h1 className="text-3xl font-bold neon-text">Fantasy.AI</h1>
            </div>
            <p className="text-gray-400">
              Welcome back to the future of fantasy sports
            </p>
          </div>

          {/* Sign In Form */}
          <GlassCard className="p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <NeonButton
                type="submit"
                className="w-full"
                disabled={isLoading}
                color="blue"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Sign In
                  </div>
                )}
              </NeonButton>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-neon-blue hover:text-neon-blue/80 transition-colors"
              >
                Forgot your password?
              </Link>
              <div className="text-sm text-gray-400">
                Don't have an account?{" "}
                <Link 
                  href="/auth/signup" 
                  className="text-neon-purple hover:text-neon-purple/80 transition-colors font-medium"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Demo Account Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <GlassCard className="p-4 border-neon-green/30">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-neon-green mb-2">Demo Account</h3>
                <p className="text-xs text-gray-400 mb-2">
                  Try Fantasy.AI with our demo account
                </p>
                <p className="text-xs font-mono text-gray-300">
                  Email: demo@fantasy.ai<br />
                  Password: demo123
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}