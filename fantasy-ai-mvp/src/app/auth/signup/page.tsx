"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Brain, Mail, Lock, Eye, EyeOff, User, Zap, Check } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function SignUpPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        toast.success("Account created successfully! Please sign in.");
        router.push("/auth/signin");
      } else {
        const error = await response.text();
        toast.error(error || "Failed to create account");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
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
              <div className="p-3 bg-neon-purple/20 rounded-full border border-neon-purple/30">
                <Brain className="w-8 h-8 text-neon-purple" />
              </div>
              <h1 className="text-3xl font-bold neon-text">Fantasy.AI</h1>
            </div>
            <p className="text-gray-400">
              Join the future of fantasy sports
            </p>
          </div>

          {/* Sign Up Form */}
          <GlassCard className="p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Create Account</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors"
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors"
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

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                    agreedToTerms 
                      ? 'bg-neon-green border-neon-green text-black' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {agreedToTerms && <Check className="w-3 h-3" />}
                </button>
                <p className="text-sm text-gray-400">
                  I agree to the{" "}
                  <Link href="/legal/terms" className="text-neon-purple hover:text-neon-purple/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy" className="text-neon-purple hover:text-neon-purple/80">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              {/* Submit Button */}
              <NeonButton
                type="submit"
                className="w-full"
                disabled={isLoading || !agreedToTerms}
                color="purple"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Create Account
                  </div>
                )}
              </NeonButton>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link 
                  href="/auth/signin" 
                  className="text-neon-blue hover:text-neon-blue/80 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}