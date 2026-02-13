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

// ✅ UPDATED: Added tooltip descriptions for each symptom
const symptoms = [
  { 
    id: "fever", 
    label: "Fever or chills",
    tooltip: "Body temperature above 100.4°F (38°C), feeling unusually hot or cold, shivering, sweating. May indicate infection or illness."
  },
  { 
    id: "cough", 
    label: "Cough",
    tooltip: "Persistent coughing, dry or productive (with mucus). Can be from respiratory infection, allergies, or irritation. Note if there's blood or color in mucus."
  },
  { 
    id: "headache", 
    label: "Headache",
    tooltip: "Pain or pressure in the head, temples, or behind eyes. Can range from mild to severe. Note location, duration, and if accompanied by nausea or light sensitivity."
  },
  { 
    id: "fatigue", 
    label: "Fatigue or tiredness",
    tooltip: "Unusual exhaustion, lack of energy, difficulty staying awake or alert. More severe than normal tiredness. May affect ability to concentrate or perform daily activities."
  },
  { 
    id: "sore_throat", 
    label: "Sore throat",
    tooltip: "Pain, scratchiness, or irritation in the throat that worsens when swallowing. May see redness, white patches, or swollen tonsils. Common with viral or bacterial infections."
  },
  { 
    id: "runny_nose", 
    label: "Runny or stuffy nose",
    tooltip: "Nasal congestion, excessive mucus production, sneezing, difficulty breathing through nose. Can be clear (allergies/cold) or colored (infection). May have sinus pressure."
  },
  { 
    id: "body_aches", 
    label: "Muscle or body aches",
    tooltip: "Widespread pain or soreness in muscles and joints. Common with flu, infections, or inflammation. Different from localized injury pain - affects multiple body areas."
  },
  { 
    id: "nausea", 
    label: "Nausea or vomiting",
    tooltip: "Feeling sick to stomach, urge to vomit, or actual vomiting. May be from stomach bug, food poisoning, motion sickness, or other illness. Note frequency and what triggers it."
  },
  { 
    id: "diarrhea", 
    label: "Diarrhea",
    tooltip: "Loose or watery stools, increased frequency of bowel movements. Can lead to dehydration. May be from infection, food intolerance, or stomach virus. Note if there's blood or severe cramping."
  },
  { 
    id: "breathing", 
    label: "Difficulty breathing",
    tooltip: "Shortness of breath, wheezing, chest tightness, rapid breathing. Can be serious - may indicate asthma, allergic reaction, or respiratory infection. Seek immediate care if severe."
  },
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
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState("none");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a health report.",
        variant: "destructive",
      });
      return;
    }

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
      const reportData = {
        user_id: user.id,
        symptoms: selectedSymptoms,
        temperature: temperature ? parseFloat(temperature) : null,
        location: location,
      };

      const { error } = await supabase
        .from("health_reports")
        .insert(reportData);

      if (error) throw error;

      toast({
        title: "✅ Health check-in submitted!",
        description: "Thank you for your daily health report. Redirecting to dashboard...",
      });

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
    setLocation("");
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
              Thank You!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Your health check-in has been submitted successfully. We'll monitor your symptoms and let you know if any action is needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Submit Another
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <DashboardHeader title="Daily Health Check-in" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Symptoms */}
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

            {/* ✅ UPDATED: Added group wrapper with custom CSS for tooltips */}
            <div className="symptom-grid grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {symptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  className="symptom-card relative flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => handleSymptomToggle(symptom.id)}
                  style={{
                    borderColor: selectedSymptoms.includes(symptom.id) ? "hsl(var(--primary))" : "hsl(var(--border))",
                    backgroundColor: selectedSymptoms.includes(symptom.id) ? "hsl(var(--primary) / 0.05)" : "transparent",
                  }}
                >
                  <Checkbox
                    checked={selectedSymptoms.includes(symptom.id)}
                    onCheckedChange={() => handleSymptomToggle(symptom.id)}
                    className="pointer-events-none"
                  />
                  <label className="flex-1 text-sm sm:text-base cursor-pointer select-none">
                    {symptom.label}
                  </label>
                  
                  {/* ✅ TOOLTIP - Shows on hover */}
                  <div className="symptom-tooltip">
                    <div className="symptom-tooltip-title">What to look for:</div>
                    <div className="symptom-tooltip-description">{symptom.tooltip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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

      {/* ✅ ADDED: CSS for symptom tooltips */}
      <style>{`
        .symptom-card {
          position: relative;
        }

        .symptom-tooltip {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          z-index: 1000;
          background: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.4;
          width: 320px;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          transition: opacity 0.3s, visibility 0.3s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          pointer-events: none;
          border: 1px solid hsl(var(--border));
        }

        .symptom-tooltip::before {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -6px;
          border-width: 6px;
          border-style: solid;
          border-color: hsl(var(--popover)) transparent transparent transparent;
        }

        .symptom-card:hover .symptom-tooltip {
          visibility: visible;
          opacity: 1;
        }

        .symptom-tooltip-title {
          font-weight: 600;
          margin-bottom: 4px;
          color: hsl(var(--primary));
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .symptom-tooltip-description {
          color: hsl(var(--muted-foreground));
          font-size: 12px;
        }

        @media (max-width: 640px) {
          .symptom-tooltip {
            width: 280px;
            font-size: 11px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default HealthCheckin;
