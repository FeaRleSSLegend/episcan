import { useState } from "react";
import { CheckCircle2, Thermometer, MessageSquare, AlertCircle, Copy, Check, Link2, Activity, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const symptoms = [
  { id: "fever", label: "Fever or chills" },
  { id: "cough", label: "Cough" },
  { id: "headache", label: "Headache" },
  { id: "fatigue", label: "Fatigue or tiredness" },
  { id: "sore_throat", label: "Sore throat" },
  { id: "runny_nose", label: "Runny or stuffy nose" },
  { id: "body_aches", label: "Muscle or body aches" },
  { id: "nausea", label: "Nausea or vomiting" },
  { id: "diarrhea", label: "Diarrhea" },
  { id: "breathing", label: "Difficulty breathing" },
];

const severityOptions = [
  { id: "none", label: "None", description: "No symptoms", color: "bg-success/10 text-success border-success/30" },
  { id: "mild", label: "Mild", description: "Minor discomfort", color: "bg-warning/10 text-warning border-warning/30" },
  { id: "moderate", label: "Moderate", description: "Noticeable symptoms", color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
  { id: "severe", label: "Severe", description: "Significant impact", color: "bg-destructive/10 text-destructive border-destructive/30" },
];

// Location options for the health report
const locationOptions = [
  "Hostel A",
  "Hostel B",
  "Hostel C",
  "Hostel D",
  "Day Scholar",
  "Other"
];

const HealthCheckin = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [temperature, setTemperature] = useState("");
  const [location, setLocation] = useState("");  // ✅ ADDED: Location field
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState("none");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();  // ✅ ADDED: For redirect after submission

  const generateInviteCode = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const { data: codeData, error: codeError } = await supabase.rpc('generate_invite_code');
      
      if (codeError) throw codeError;
      
      const code = codeData as string;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const { error } = await supabase
        .from("invite_codes")
        .insert({
          code,
          student_user_id: user.id,
          expires_at: expiresAt.toISOString(),
        });
      
      if (error) throw error;
      
      setInviteCode(code);
      toast({
        title: "Invite code generated!",
        description: "Share this code with your parent to link accounts.",
      });
    } catch (error) {
      console.error("Error generating invite code:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard.",
      });
    }
  };

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ VALIDATION: Check if user is logged in
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a health report.",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDATION: Check if location is selected
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please select your location before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ FIXED: Match health_reports table schema exactly
      const reportData = {
        user_id: user.id,              // ✅ Links report to logged-in user
        symptoms: selectedSymptoms,     // ✅ Array of strings (e.g., ['fever', 'cough'])
        temperature: temperature ? parseFloat(temperature) : null,  // ✅ Float or null
        location: location,             // ✅ Required field (e.g., 'Hostel A')
        // REMOVED: notes and severity (not in health_reports schema)
      };

      // ✅ FIXED: Changed from 'symptom_reports' to 'health_reports'
      const { error } = await supabase
        .from("health_reports")
        .insert(reportData);

      if (error) throw error;

      // ✅ SUCCESS: Show toast and redirect to dashboard
      toast({
        title: "✅ Health check-in submitted!",
        description: "Thank you for your daily health report. Redirecting to dashboard...",
      });

      // ✅ ADDED: Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit health report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setTemperature("");
    setLocation("");  // ✅ ADDED: Reset location
    setNotes("");
    setSeverity("none");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <DashboardLayout userRole="student">
        <DashboardHeader title="Daily Health Check-in" />
        <div className="p-4 sm:p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-success" />
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
              Check-in Complete!
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
              Thank you for submitting your daily health report. Stay healthy and have a great day!
            </p>
            
            {/* Health Tips */}
            <div className="bg-primary/5 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Health Tips
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Stay hydrated - drink plenty of water</li>
                <li>• Get enough rest (8+ hours of sleep)</li>
                <li>• Wash hands frequently</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate("/dashboard")} className="w-full sm:w-auto">
                View Dashboard
              </Button>
              <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                Submit Another Report
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <DashboardHeader 
        title="Daily Health Check-in" 
        subtitle="How are you feeling today?"
      />
      
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Symptoms Selection */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                  Symptoms Check
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Select any symptoms you're experiencing today
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {symptoms.map((symptom) => (
                <label
                  key={symptom.id}
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSymptoms.includes(symptom.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <Checkbox
                    checked={selectedSymptoms.includes(symptom.id)}
                    onCheckedChange={() => handleSymptomToggle(symptom.id)}
                  />
                  <span className="text-foreground text-sm sm:text-base">{symptom.label}</span>
                </label>
              ))}
            </div>

            {selectedSymptoms.length === 0 && (
              <div className="mt-4 p-3 sm:p-4 bg-success/10 rounded-lg flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span className="text-success font-medium text-sm sm:text-base">No symptoms? Great! You're feeling healthy.</span>
              </div>
            )}
          </div>

          {/* Severity Selection - Only show if symptoms selected */}
          {selectedSymptoms.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                    Severity Level
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    How severe are your symptoms?
                  </p>
                </div>
              </div>

              <RadioGroup value={severity} onValueChange={setSeverity} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {severityOptions.slice(1).map((option) => (
                  <div key={option.id}>
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.id}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all
                        ${severity === option.id ? option.color : "border-border hover:border-primary/30"}
                      `}
                    >
                      <span className="font-medium text-sm sm:text-base">{option.label}</span>
                      <span className="text-xs text-muted-foreground mt-1 text-center hidden sm:block">{option.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Location Selection - REQUIRED */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                  Location <span className="text-destructive">*</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Where are you currently staying?
                </p>
              </div>
            </div>

            <RadioGroup value={location} onValueChange={setLocation} className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {locationOptions.map((loc) => (
                <div key={loc}>
                  <RadioGroupItem
                    value={loc}
                    id={`location-${loc}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`location-${loc}`}
                    className={`flex items-center justify-center rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all text-sm sm:text-base
                      ${location === loc
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:border-primary/30 text-foreground"}
                    `}
                  >
                    {loc}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {!location && (
              <p className="mt-3 text-xs sm:text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Please select your location to continue
              </p>
            )}
          </div>

          {/* Temperature */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                  Temperature (Optional)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enter your temperature if you've measured it
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.1"
                min="35"
                max="42"
                placeholder="36.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-24 sm:w-32 h-10 sm:h-12 text-base sm:text-lg"
              />
              <span className="text-muted-foreground text-sm sm:text-base">°C</span>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                  Additional Notes (Optional)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Anything else you'd like to share
                </p>
              </div>
            </div>

            <Textarea
              placeholder="Any additional information about how you're feeling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-sm sm:text-base"
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            variant="hero" 
            size="lg" 
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Health Report"}
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </form>

        {/* Parent Link Section */}
        <div className="mt-6 sm:mt-8 bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                Link Parent Account
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Generate a code for your parent to monitor your health
              </p>
            </div>
          </div>

          {inviteCode ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 bg-muted rounded-lg p-3 sm:p-4 text-center">
                  <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-foreground">
                    {inviteCode}
                  </span>
                </div>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-10 w-10 sm:h-12 sm:w-12">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                This code expires in 7 days. Share it with your parent.
              </p>
              <Button variant="outline" onClick={generateInviteCode} disabled={isGenerating} className="w-full">
                Generate New Code
              </Button>
            </div>
          ) : (
            <Button onClick={generateInviteCode} disabled={isGenerating} className="w-full">
              {isGenerating ? "Generating..." : "Generate Invite Code"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HealthCheckin;