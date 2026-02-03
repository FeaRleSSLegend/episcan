import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, GraduationCap, Users2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/ui/back-button";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type UserRole = "student" | "parent";

const roleOptions = [
  { value: "student" as UserRole, label: "Student", icon: GraduationCap, description: "Daily health check-ins" },
  { value: "parent" as UserRole, label: "Parent", icon: Users2, description: "Monitor your child" },
];

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !selectedRole) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields and select a role.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, name, selectedRole);
    
    if (error) {
      let message = "Failed to create account. Please try again.";
      if (error.message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      } else if (error.message.includes("valid email")) {
        message = "Please enter a valid email address.";
      }
      
      toast({
        title: "Sign up failed",
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
                Create your account
              </h1>
              <p className="text-muted-foreground">
                Join EPISCAN to start monitoring health
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedRole === role.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <role.icon className={`h-6 w-6 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`font-medium text-sm ${selectedRole === role.value ? "text-primary" : "text-foreground"}`}>
                        {role.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Health Officer and Admin roles are assigned by administrators.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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

              <Button type="submit" variant="hero" className="w-full h-12" disabled={!selectedRole || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By signing up, you agree to our{" "}
                <Link to="#" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link to="#" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>

            {/* Sign In Link */}
            <p className="mt-8 text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
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
            Join the Health Revolution
          </h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            Create your account and start protecting your school community with real-time health monitoring and early outbreak detection.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6 pt-10 border-t border-primary-foreground/10">
            <div>
              <p className="font-heading text-2xl font-bold">500+</p>
              <p className="text-sm text-primary-foreground/70">Schools</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold">100K+</p>
              <p className="text-sm text-primary-foreground/70">Students</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold">99.9%</p>
              <p className="text-sm text-primary-foreground/70">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
