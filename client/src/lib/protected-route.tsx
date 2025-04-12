import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { PortalType } from "@shared/schema";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { PartnerDashboard } from "@/components/dashboard/partner-dashboard";
import { PoloDashboard } from "@/components/dashboard/polo-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

interface ProtectedRouteProps {
  path: string;
  portalType: PortalType;
}

export function ProtectedRoute({ path, portalType }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Map portal types to their dashboard components
  const dashboardComponents = {
    student: StudentDashboard,
    partner: PartnerDashboard,
    polo: PoloDashboard,
    admin: AdminDashboard,
  };

  const DashboardComponent = dashboardComponents[portalType];

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          setLocation("/auth");
          return null;
        }

        // Check if user has access to the requested portal
        if (user.portalType !== portalType) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                You don't have permission to access this portal.
              </p>
              <button
                className="px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => setLocation(`/${user.portalType}/dashboard`)}
              >
                Go to your dashboard
              </button>
            </div>
          );
        }

        return <DashboardComponent />;
      }}
    </Route>
  );
}
