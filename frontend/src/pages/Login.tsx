import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/ui/back-button";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      let message = "Failed to sign in. Please try again.";
      if (error.message.includes("Invalid login credentials")) {
        message = "Invalid email or password.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Please confirm your email before signing in.";
      }
      
      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col p-6 lg:p-12">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton fallbackPath="/" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <img src={logo} alt="EPISCAN" className="h-10 w-10" />
              <span className="font-heading font-bold text-xl text-foreground">EPISCAN</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                Welcome back
              </h1>
              <p className="text-muted-foreground">
                Sign in to access your health dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="w-20 h-20 mx-auto mb-8 bg-primary-foreground/10 rounded-2xl flex items-center justify-center">
            <img src={logo} alt="EPISCAN" className="h-12 w-12 brightness-0 invert" />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-4">
            Protecting Students, Empowering Schools
          </h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            Join over 500 schools using EPISCAN to monitor student health and detect outbreaks early. Together, we create safer learning environments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
