import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check for pending status
  if (user.status === "pending") {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-semibold mb-4">Account Pending Approval</h1>
          <p className="text-gray-600 max-w-md text-center">
            Your account is pending approval by an administrator. 
            You'll receive an email notification once your account is approved.
          </p>
        </div>
      </Route>
    );
  }

  // Check for admin-only routes
  if (adminOnly && user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600 max-w-md text-center">
            You don't have permission to access this page. 
            This area is restricted to administrators only.
          </p>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <div className="flex h-screen overflow-hidden">
        <CollapsibleSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Component />
        </div>
      </div>
    </Route>
  );
}