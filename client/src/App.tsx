import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeContext } from "@/lib/theme";
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
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden">
      <CollapsibleSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/databases" component={Databases} />
          <Route path="/system-health" component={SystemHealth} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/history" component={History} />
          <Route path="/users" component={UserManagement} />
          <Route path="/groups" component={Groups} />
          <Route path="/thresholds" component={Thresholds} />
          <Route path="/metrics" component={MetricConfig} />
          <Route path="/integrations" component={Integrations} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
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
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
