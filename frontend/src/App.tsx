import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RedirectIfAuthenticated from "@/components/auth/RedirectIfAuthenticated";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import HealthCheckin from "./pages/HealthCheckin";
import StudentAlerts from "./pages/dashboard/StudentAlerts";
import HealthTips from "./pages/dashboard/HealthTips";
import AnonymousMessage from "./pages/dashboard/AnonymousMessage";
import OfficerMessages from "./pages/dashboard/OfficerMessages";
import UserManagement from "./pages/dashboard/UserManagement";
import HealthOverview from "./pages/dashboard/HealthOverview";
import Notifications from "./pages/dashboard/Notifications";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";
import HelpSupport from "./pages/dashboard/HelpSupport";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import Heatmap from "./pages/dashboard/Heatmap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              } />
              <Route path="/signup" element={
                <RedirectIfAuthenticated>
                  <Signup />
                </RedirectIfAuthenticated>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/checkin" element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <HealthCheckin />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/alerts" element={
                <ProtectedRoute allowedRoles={["student", "parent", "health_officer"]}>
                  <StudentAlerts />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/heatmap" element={
                <ProtectedRoute allowedRoles={["health_officer", "admin", "parent"]}>
                  <Heatmap />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/tips" element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <HealthTips />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/messages" element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <AnonymousMessage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/officer-messages" element={
                <ProtectedRoute allowedRoles={["health_officer", "admin"]}>
                  <OfficerMessages />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin/users" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/overview" element={
                <ProtectedRoute allowedRoles={["admin", "health_officer"]}>
                  <HealthOverview />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/notifications" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/reports" element={
                <ProtectedRoute allowedRoles={["admin", "health_officer"]}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/help" element={
                <ProtectedRoute>
                  <HelpSupport />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
