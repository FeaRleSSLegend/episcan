import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Mail, MessageSquare, Book, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const HelpSupport = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const faqs = [
    {
      question: "How do I complete a daily health check-in?",
      answer: "Navigate to the 'Health Check-in' section from your dashboard. Fill in your current symptoms, temperature (if known), and any additional notes. Submit the form to complete your daily check-in.",
    },
    {
      question: "What happens when I report symptoms?",
      answer: "Your symptom report is securely stored and analyzed. If concerning symptoms are detected, the health officer will be notified. You'll also receive personalized health tips based on your report.",
    },
    {
      question: "How do I send an anonymous message?",
      answer: "Go to the 'Messages' section in your dashboard. While your message is linked to your account for response purposes, the health officer will handle it with confidentiality.",
    },
    {
      question: "Who can see my health data?",
      answer: "Your health data is only visible to you, health officers, and administrators. Parents can only see data for their linked children. All data is encrypted and stored securely.",
    },
    {
      question: "How do I link my parent account to my child?",
      answer: "Your child must generate an invite code from their student dashboard. Enter this code in your parent dashboard to link accounts and view their health information.",
    },
    {
      question: "What should I do if I forget my password?",
      answer: "Click on 'Forgot Password' on the login page. Enter your email address, and we'll send you a link to reset your password.",
    },
  ];

  const handleSubmitSupport = () => {
    if (!subject || !message) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Support request submitted. We'll get back to you soon!");
    setSubject("");
    setMessage("");
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Help & Support"
        subtitle="Get help and find answers to common questions"
      />

      <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 text-center">
              <Book className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">User Guide</h3>
              <p className="text-sm text-muted-foreground">Learn how to use EPISCAN</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Chat with support team</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="pt-6 text-center">
              <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@episcan.com</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Find answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Send us a message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="What do you need help with?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Describe your issue or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>
            <Button onClick={handleSubmitSupport}>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-destructive/10">
                <HelpCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium text-destructive">Emergency Health Concerns?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  If you or someone else is experiencing a medical emergency, please contact
                  your local emergency services immediately or visit the nearest hospital.
                </p>
                <p className="text-sm font-medium mt-2">Emergency: 911 (US) / 999 (UK)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HelpSupport;
