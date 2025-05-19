import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeContext } from "@/lib/theme";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Databases from "@/pages/Databases";
import SystemHealth from "@/pages/SystemHealth";
import Alerts from "@/pages/Alerts";
import History from "@/pages/History";
import UserManagement from "@/pages/UserManagement";
import Groups from "@/pages/Groups";
import Thresholds from "@/pages/Thresholds";
import Integrations from "@/pages/Integrations";
import Settings from "@/pages/Settings";
import MetricConfig from "@/pages/MetricConfig";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";

function Router() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/databases" component={Databases} />
      <ProtectedRoute path="/system-health" component={SystemHealth} />
      <ProtectedRoute path="/alerts" component={Alerts} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/users" component={UserManagement} adminOnly />
      <ProtectedRoute path="/groups" component={Groups} />
      <ProtectedRoute path="/thresholds" component={Thresholds} />
      <ProtectedRoute path="/metrics" component={MetricConfig} />
      <ProtectedRoute path="/integrations" component={Integrations} adminOnly />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;