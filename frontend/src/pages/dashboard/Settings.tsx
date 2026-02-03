import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Globe, Bell, Shield, Save } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [language, setLanguage] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [dataRetention, setDataRetention] = useState("90days");

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Settings"
        subtitle="Manage your application preferences"
      />

      <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Language & Region
            </CardTitle>
            <CardDescription>Configure language and regional settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-muted-foreground">
                  Select your preferred language
                </p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Control how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Check-in Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Remind users to complete daily health check-ins
                </p>
              </div>
              <Switch
                checked={dailyReminders}
                onCheckedChange={setDailyReminders}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Health Alert Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Notify when health alerts are triggered
                </p>
              </div>
              <Switch
                checked={alertNotifications}
                onCheckedChange={setAlertNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Data Privacy
            </CardTitle>
            <CardDescription>Manage data retention and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Retention Period</p>
                <p className="text-sm text-muted-foreground">
                  How long to keep health check-in data
                </p>
              </div>
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="90days">90 Days</SelectItem>
                  <SelectItem value="180days">180 Days</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium">Data Export</p>
              <p className="text-sm text-muted-foreground mb-2">
                Download all platform data for compliance or backup
              </p>
              <Button variant="outline" size="sm">
                Export All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings (Admin Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              System Configuration
            </CardTitle>
            <CardDescription>Advanced system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">School Name</label>
              <Input placeholder="Enter school name" defaultValue="" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Email</label>
              <Input placeholder="admin@school.edu" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in Reminder Time</label>
              <Input type="time" defaultValue="08:00" />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
