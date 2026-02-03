import { useState } from "react";
import { 
  Lightbulb, 
  Droplets, 
  Moon, 
  Utensils, 
  Activity, 
  Heart, 
  ShieldCheck, 
  Hand,
  Download,
  BookOpen
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface HealthTip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
}

const HealthTips = () => {
  const [activeCategory, setActiveCategory] = useState("hygiene");

  const categories = [
    { id: "hygiene", label: "Hygiene", icon: <Hand className="h-4 w-4" /> },
    { id: "nutrition", label: "Nutrition", icon: <Utensils className="h-4 w-4" /> },
    { id: "wellness", label: "Wellness", icon: <Heart className="h-4 w-4" /> },
    { id: "prevention", label: "Prevention", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  const tipsByCategory: Record<string, HealthTip[]> = {
    hygiene: [
      {
        id: "1",
        icon: <Hand className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Hand Washing",
        description: "Wash hands frequently with soap and water for at least 20 seconds",
        details: [
          "Before eating or preparing food",
          "After using the restroom",
          "After coughing, sneezing, or blowing your nose",
          "After touching public surfaces",
        ],
      },
      {
        id: "2",
        icon: <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Respiratory Hygiene",
        description: "Cover your mouth and nose when coughing or sneezing",
        details: [
          "Use a tissue or your elbow, not your hands",
          "Dispose of tissues immediately",
          "Wash hands after coughing or sneezing",
          "Stay home when feeling unwell",
        ],
      },
    ],
    nutrition: [
      {
        id: "3",
        icon: <Droplets className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Stay Hydrated",
        description: "Drink at least 8 glasses of water daily",
        details: [
          "Carry a reusable water bottle",
          "Drink water before, during, and after exercise",
          "Limit sugary drinks and sodas",
          "Eat water-rich fruits and vegetables",
        ],
      },
      {
        id: "4",
        icon: <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Balanced Diet",
        description: "Eat a variety of nutritious foods every day",
        details: [
          "Include fruits and vegetables in every meal",
          "Choose whole grains over refined grains",
          "Limit processed foods and snacks",
          "Eat breakfast to fuel your day",
        ],
      },
    ],
    wellness: [
      {
        id: "5",
        icon: <Moon className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Quality Sleep",
        description: "Get 8-10 hours of sleep for optimal health",
        details: [
          "Keep a consistent sleep schedule",
          "Avoid screens before bedtime",
          "Create a dark, quiet sleeping environment",
          "Avoid caffeine in the afternoon",
        ],
      },
      {
        id: "6",
        icon: <Activity className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Stay Active",
        description: "Aim for at least 60 minutes of physical activity daily",
        details: [
          "Walk or bike to school when possible",
          "Participate in PE classes and sports",
          "Take breaks from sitting every hour",
          "Find activities you enjoy doing",
        ],
      },
    ],
    prevention: [
      {
        id: "7",
        icon: <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Vaccinations",
        description: "Stay up-to-date with recommended vaccinations",
        details: [
          "Check with your doctor about required vaccines",
          "Get annual flu shots when available",
          "Keep your vaccination records updated",
          "Ask about any school-required immunizations",
        ],
      },
      {
        id: "8",
        icon: <Heart className="h-5 w-5 sm:h-6 sm:w-6" />,
        title: "Mental Health",
        description: "Take care of your emotional well-being",
        details: [
          "Talk to trusted adults when feeling stressed",
          "Practice relaxation techniques",
          "Stay connected with friends and family",
          "Take breaks and do activities you enjoy",
        ],
      },
    ],
  };

  const resources = [
    { title: "Hand Washing Guide", type: "PDF", icon: <Download className="h-4 w-4" /> },
    { title: "Healthy Eating Plate", type: "PDF", icon: <Download className="h-4 w-4" /> },
    { title: "Sleep Hygiene Tips", type: "PDF", icon: <Download className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout userRole="student">
      <DashboardHeader
        title="Health Tips"
        subtitle="Learn how to stay healthy and prevent illness"
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Quick Tips Banner */}
        <div className="bg-gradient-primary rounded-xl p-4 sm:p-6 text-primary-foreground">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg flex-shrink-0">
              <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                Daily Health Tip
              </h2>
              <p className="text-primary-foreground/90 text-sm sm:text-base">
                Remember to wash your hands for at least 20 seconds - that's about the time it takes to sing "Happy Birthday" twice!
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm data-[state=active]:bg-background"
              >
                {cat.icon}
                <span className="hidden xs:inline sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(tipsByCategory).map(([category, tips]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {tips.map((tip) => (
                  <Card key={tip.id} className="bg-card border-border">
                    <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          {tip.icon}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm sm:text-base font-semibold truncate">
                            {tip.title}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-2 sm:pt-0">
                      <ul className="space-y-1.5 sm:space-y-2">
                        {tip.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Educational Resources */}
        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Educational Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-0">
            <div className="grid sm:grid-cols-3 gap-3">
              {resources.map((resource, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto py-3 sm:py-4 flex flex-col items-center gap-2 hover:bg-muted/50"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {resource.icon}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center">{resource.title}</span>
                  <span className="text-xs text-muted-foreground">{resource.type}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HealthTips;
