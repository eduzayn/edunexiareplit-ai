import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PortalSelectionPage from "@/pages/portal-selection-page";
import ModulosPage from "@/pages/modulos-page";
import PlanosPage from "@/pages/planos-page";
import SobrePage from "@/pages/sobre-page";
import ContatoPage from "@/pages/contato-page";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth, AuthProvider } from "./hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth">
        {() => {
          if (user) {
            const dashboardPath = `/${user.portalType}/dashboard`;
            window.location.href = dashboardPath;
            return null;
          }
          return <AuthPage />;
        }}
      </Route>
      <Route path="/portal-selection" component={PortalSelectionPage} />
      
      <Route path="/modulos" component={ModulosPage} />
      <Route path="/planos" component={PlanosPage} />
      <Route path="/sobre" component={SobrePage} />
      <Route path="/contato" component={ContatoPage} />
      <Route path="/blog" component={NotFound} />
      
      <ProtectedRoute path="/student/dashboard" portalType="student" />
      <ProtectedRoute path="/partner/dashboard" portalType="partner" />
      <ProtectedRoute path="/polo/dashboard" portalType="polo" />
      <ProtectedRoute path="/admin/dashboard" portalType="admin" />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
