import { useState } from "react";
import { CheckCircle2, Thermometer, MessageSquare, AlertCircle, Copy, Check, Link2, Activity, MapPin, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const symptoms = [
  { id: "fever", label: "Fever or chills", tooltip: "Body temperature above 100.4°F (38°C), feeling unusually hot or cold, shivering, sweating. May indicate infection or illness." },
  { id: "cough", label: "Cough", tooltip: "Persistent coughing, dry or productive (with mucus). Can be from respiratory infection, allergies, or irritation." },
  { id: "headache", label: "Headache", tooltip: "Pain or pressure in the head, temples, or behind eyes. Note location, duration, and if accompanied by nausea or light sensitivity." },
  { id: "fatigue", label: "Fatigue or tiredness", tooltip: "Unusual exhaustion, lack of energy, difficulty staying awake or alert. More severe than normal tiredness." },
  { id: "sore_throat", label: "Sore throat", tooltip: "Pain, scratchiness, or irritation in the throat that worsens when swallowing. May see redness or swollen tonsils." },
  { id: "runny_nose", label: "Runny or stuffy nose", tooltip: "Nasal congestion, excessive mucus, sneezing, difficulty breathing through nose. May have sinus pressure." },
  { id: "body_aches", label: "Muscle or body aches", tooltip: "Widespread pain or soreness in muscles and joints. Common with flu or infections. Affects multiple body areas." },
  { id: "nausea", label: "Nausea or vomiting", tooltip: "Feeling sick to stomach, urge to vomit, or actual vomiting. Note frequency and what triggers it." },
  { id: "diarrhea", label: "Diarrhea", tooltip: "Loose or watery stools, increased frequency. Can lead to dehydration. Note if there's blood or severe cramping." },
  { id: "breathing", label: "Difficulty breathing", tooltip: "Shortness of breath, wheezing, chest tightness. Can be serious — seek immediate care if severe." },
];

const severityOptions = [
  { id: "mild", label: "Mild", description: "Minor discomfort", color: "border-warning bg-warning/5 text-warning" },
  { id: "moderate", label: "Moderate", description: "Noticeable symptoms", color: "border-orange-500 bg-orange-500/5 text-orange-500" },
  { id: "severe", label: "Severe", description: "Significant impact", color: "border-destructive bg-destructive/5 text-destructive" },
];

// Two-step location: pick group first, then specific hostel
const locationGroups = [
  {
    id: "boys",
    label: "Boys' Hostel",
    emoji: "🏠",
    options: [
      "Hostel A", "Hostel B", "Hostel C", "Hostel D", "Hostel E",
      "Hostel F", "Hostel G", "Hostel H", "Hostel I", "Hostel J",
      "Hostel K", "Hostel L", "Hostel M", "Hostel N", "Hostel O",
      "Hostel P", "Hostel Q", "Hostel R", "Hostel S"
    ]
  },
  {
    id: "girls",
    label: "Girls' Hostel",
    emoji: "🏠",
    options: ["CICL", "Pa Etos", "New Kelson", "Old Kelson", "Stanzel"]
  },
  {
    id: "day",
    label: "Day Scholar",
    emoji: "🎒",
    options: ["Day Scholar"]
  }
];

const HealthCheckin = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [temperature, setTemperature] = useState("");
  const [locationGroup, setLocationGroup] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleGroupSelect = (groupId: string) => {
    const group = locationGroups.find(g => g.id === groupId);
    if (group?.options.length === 1) {
      // Day Scholar — auto-select since there's only one option
      setLocationGroup(groupId);
      setLocation(group.options[0]);
    } else {
      setLocationGroup(groupId);
      setLocation("");
    }
  };

  const handleLocationReset = () => {
    setLocationGroup(null);
    setLocation("");
  };

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
        .insert({ code, student_user_id: user.id, expires_at: expiresAt.toISOString() });

      if (error) throw error;
      setInviteCode(code);
      toast({ title: "Invite code generated!", description: "Share this code with your parent to link accounts." });
    } catch (error) {
      console.error("Error generating invite code:", error);
      toast({ title: "Error", description: "Failed to generate invite code.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a health report.", variant: "destructive" });
      return;
    }

    if (!location) {
      toast({ title: "Location Required", description: "Please select your location before submitting.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("health_reports")
        .insert({
          user_id: user.id,
          symptoms: selectedSymptoms,
          temperature: temperature ? parseFloat(temperature) : null,
          location: location,
          severity: selectedSymptoms.length > 0 ? severity : null,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast({ title: "✅ Health check-in submitted!", description: "Thank you for your daily health report." });
      setSubmitted(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit health report.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setTemperature("");
    setLocationGroup(null);
    setLocation("");
    setNotes("");
    setSeverity("moderate");
    setSubmitted(false);
  };

  const activeGroup = locationGroups.find(g => g.id === locationGroup);

  if (submitted) {
    return (
      <DashboardLayout userRole="student">
        <DashboardHeader title="Daily Health Check-in" />
        <div className="p-4 sm:p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-success" />
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Thank You!</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Your health check-in has been submitted successfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button onClick={resetForm} variant="outline" className="flex-1">Submit Another</Button>
              <Button onClick={() => navigate("/dashboard")} className="flex-1">Back to Dashboard</Button>
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

          {/* SYMPTOMS */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Symptoms Check</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Select any symptoms you're experiencing today</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom.id);
                return (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => handleSymptomToggle(symptom.id)}
                    className={`symptom-card relative text-left flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`flex-1 text-sm sm:text-base font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {symptom.label}
                    </span>
                    <div className="symptom-tooltip">
                      <div className="symptom-tooltip-title">What to look for:</div>
                      <div className="symptom-tooltip-description">{symptom.tooltip}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedSymptoms.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* SEVERITY */}
          {selectedSymptoms.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Severity Level</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">How severe are your symptoms overall?</p>
                </div>
              </div>
              <RadioGroup value={severity} onValueChange={setSeverity} className="grid grid-cols-3 gap-2 sm:gap-3">
                {severityOptions.map((option) => (
                  <div key={option.id}>
                    <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                    <Label
                      htmlFor={option.id}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all ${
                        severity === option.id ? option.color : "border-border hover:border-primary/30 text-foreground"
                      }`}
                    >
                      <span className="font-medium text-sm sm:text-base">{option.label}</span>
                      <span className="text-xs text-muted-foreground mt-1 text-center hidden sm:block">{option.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* LOCATION — two-step grouped selection */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
                  Location <span className="text-destructive">*</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {!locationGroup
                    ? "Select your accommodation type"
                    : location
                    ? `${activeGroup?.label} → ${location}`
                    : `Select your hostel in ${activeGroup?.label}`}
                </p>
              </div>
              {locationGroup && (
                <button
                  type="button"
                  onClick={handleLocationReset}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Change
                </button>
              )}
            </div>

            {/* Step 1: Pick group */}
            {!locationGroup && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {locationGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupSelect(group.id)}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-border p-4 sm:p-5 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="text-2xl">{group.emoji}</span>
                    <span className="text-xs sm:text-sm font-medium text-foreground text-center leading-tight">{group.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Pick specific hostel */}
            {locationGroup && activeGroup && activeGroup.options.length > 1 && (
              <div className={`grid gap-2 sm:gap-2 ${
                activeGroup.options.length > 6
                  ? "grid-cols-4 sm:grid-cols-5"
                  : "grid-cols-2 sm:grid-cols-3"
              }`}>
                {activeGroup.options.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`flex items-center justify-center rounded-lg border-2 p-2 sm:p-3 cursor-pointer transition-all text-sm font-medium ${
                      location === loc
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}

            {/* Day Scholar auto-confirmed */}
            {locationGroup === "day" && location && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-primary font-medium">Day Scholar selected</span>
              </div>
            )}

            {!location && (
              <p className="mt-3 text-xs sm:text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {!locationGroup ? "Please select your accommodation type" : "Please select your specific hostel"}
              </p>
            )}
          </div>

          {/* TEMPERATURE */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Temperature (Optional)</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Enter your temperature if you've measured it</p>
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

          {/* NOTES */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Additional Notes (Optional)</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Anything else you'd like to share</p>
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

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full gap-2"
            disabled={isSubmitting || !location}
          >
            {isSubmitting ? "Submitting..." : "Submit Health Report"}
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </form>

        {/* PARENT LINK */}
        <div className="mt-6 sm:mt-8 bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Link Parent Account</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Generate a code for your parent to monitor your health</p>
            </div>
          </div>
          {inviteCode ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 bg-muted rounded-lg p-3 sm:p-4 text-center">
                  <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-foreground">{inviteCode}</span>
                </div>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-10 w-10 sm:h-12 sm:w-12">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">This code expires in 7 days. Share it with your parent.</p>
              <Button variant="outline" onClick={generateInviteCode} disabled={isGenerating} className="w-full">Generate New Code</Button>
            </div>
          ) : (
            <Button onClick={generateInviteCode} disabled={isGenerating} className="w-full">
              {isGenerating ? "Generating..." : "Generate Invite Code"}
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .symptom-card { position: relative; overflow: visible; }

        .symptom-tooltip {
          visibility: hidden;
          opacity: 0;
          position: fixed;
          z-index: 9999;
          background: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.5;
          width: 280px;
          pointer-events: none;
          transition: opacity 0.2s, visibility 0.2s;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          border: 1px solid hsl(var(--border));
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
        }

        @media (max-width: 640px) {
          .symptom-tooltip {
            bottom: auto;
            top: calc(100% + 8px);
            width: 240px;
            font-size: 11px;
          }
        }

        .symptom-card:hover .symptom-tooltip { visibility: visible; opacity: 1; }

        .symptom-tooltip-title {
          font-weight: 600;
          margin-bottom: 4px;
          color: hsl(var(--primary));
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .symptom-tooltip-description { color: hsl(var(--muted-foreground)); }
      `}</style>
    </DashboardLayout>
  );
};

export default HealthCheckin;