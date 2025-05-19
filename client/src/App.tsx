import { useState, useEffect } from 'react';
import { Switch, Route, useLocation, Redirect } from "wouter";
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
      <Route path="/">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Dashboard />
          </div>
        </div>
      </Route>
      <Route path="/databases">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Databases />
          </div>
        </div>
      </Route>
      <Route path="/system-health">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <SystemHealth />
          </div>
        </div>
      </Route>
      <Route path="/alerts">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Alerts />
          </div>
        </div>
      </Route>
      <Route path="/history">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <History />
          </div>
        </div>
      </Route>
      <Route path="/users">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <UserManagement />
          </div>
        </div>
      </Route>
      <Route path="/groups">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Groups />
          </div>
        </div>
      </Route>
      <Route path="/thresholds">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Thresholds />
          </div>
        </div>
      </Route>
      <Route path="/metrics">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <MetricConfig />
          </div>
        </div>
      </Route>
      <Route path="/integrations">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Integrations />
          </div>
        </div>
      </Route>
      <Route path="/settings">
        <div className="flex h-screen overflow-hidden">
          <CollapsibleSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Settings />
          </div>
        </div>
      </Route>
      <Route>
        <NotFound />
      </Route>
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
