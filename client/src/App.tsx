import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PortalSelectionPage from "@/pages/portal-selection-page";
import ModulosPage from "@/pages/modulos-page";
import PlanosPage from "@/pages/planos-page";
import SobrePage from "@/pages/sobre-page";
import ContatoPage from "@/pages/contato-page";
import BlogPage from "@/pages/blog-page";
import AdminAuthPage from "@/pages/admin-auth-page";
import PoloAuthPage from "@/pages/polo-auth-page";
import DisciplinesPage from "@/pages/admin/disciplines-page";
import CoursesPage from "@/pages/admin/courses-page";
import CourseFormPage from "@/pages/admin/course-form-page";
import DisciplineContentPage from "@/pages/admin/discipline-content-page";
import InstitutionsPage from "@/pages/admin/institutions-page";
import UsersPage from "@/pages/admin/users-page";
import PolosPage from "@/pages/admin/polos-page";
import PartnersPage from "@/pages/admin/partners-page";
import FinancialPage from "@/pages/admin/financial-page";
import ReportsPage from "@/pages/admin/reports-page";
import EnrollmentsPage from "@/pages/admin/enrollments-page";
import AdminNewEnrollmentPage from "@/pages/admin/new-enrollment-page";
import IntegrationsPage from "@/pages/admin/integrations-page";
// Import student pages
import StudentCoursesPage from "@/pages/student/courses-page";
import CourseDetailPage from "@/pages/student/course-detail-page";
import DisciplineVideoPage from "@/pages/student/discipline-video-page";
import DisciplinePdfPage from "@/pages/student/discipline-pdf-page";
import DisciplineEbookPage from "@/pages/student/discipline-ebook-page";
import DisciplineSimuladoPage from "@/pages/student/discipline-simulado-page";
import DisciplineAvaliacaoPage from "@/pages/student/discipline-avaliacao-page";
import LibraryPage from "@/pages/student/library-page";
import SecretariaPage from "@/pages/student/secretaria-page";
import CredencialPage from "@/pages/student/credencial-page";
import LearningPage from "@/pages/student/learning-page";
// Import polo pages
import PoloEnrollmentsPage from "@/pages/polo/enrollments-page";
import PoloNewEnrollmentPage from "@/pages/polo/new-enrollment-page";
import PoloStudentsPage from "@/pages/polo/students-page";
import PoloReportsPage from "@/pages/polo/reports-page";
import PoloSettingsPage from "@/pages/polo/settings-page";
import PoloSalesLinksPage from "@/pages/polo/sales-links-page";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth, AuthProvider } from "./hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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
            // Use setLocation ao invés de window.location.href para evitar recarregar a página
            setLocation(dashboardPath);
            return null;
          }
          return <AuthPage />;
        }}
      </Route>
      <Route path="/portal-selection" component={PortalSelectionPage} />
      <Route path="/admin">
        {() => {
          if (user && user.portalType === "admin") {
            setLocation("/admin/dashboard");
            return null;
          }
          return <AdminAuthPage />;
        }}
      </Route>
      
      <Route path="/polo">
        {() => {
          if (user && user.portalType === "polo") {
            setLocation("/polo/dashboard");
            return null;
          }
          return <PoloAuthPage />;
        }}
      </Route>
      
      <Route path="/modulos" component={ModulosPage} />
      <Route path="/planos" component={PlanosPage} />
      <Route path="/sobre" component={SobrePage} />
      <Route path="/contato" component={ContatoPage} />
      <Route path="/blog" component={BlogPage} />
      
      <ProtectedRoute path="/student/dashboard" portalType="student" />
      <Route path="/student/courses">
        {() => user?.portalType === "student" ? <StudentCoursesPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/courses/:id">
        {() => user?.portalType === "student" ? <CourseDetailPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/discipline/:id/video/:videoNumber">
        {() => user?.portalType === "student" ? <DisciplineVideoPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/discipline/:id/apostila">
        {() => user?.portalType === "student" ? <DisciplinePdfPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/discipline/:id/ebook">
        {() => user?.portalType === "student" ? <DisciplineEbookPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/discipline/:id/simulado">
        {() => user?.portalType === "student" ? <DisciplineSimuladoPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/discipline/:id/avaliacao">
        {() => user?.portalType === "student" ? <DisciplineAvaliacaoPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/library">
        {() => user?.portalType === "student" ? <LibraryPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/secretaria">
        {() => user?.portalType === "student" ? <SecretariaPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/credencial">
        {() => user?.portalType === "student" ? <CredencialPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/student/learning">
        {() => user?.portalType === "student" ? <LearningPage /> : <Redirect to="/auth" />}
      </Route>
      <ProtectedRoute path="/partner/dashboard" portalType="partner" />
      <ProtectedRoute path="/polo/dashboard" portalType="polo" />
      <Route path="/polo/enrollments">
        {() => user?.portalType === "polo" ? <PoloEnrollmentsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/enrollments/new">
        {() => user?.portalType === "polo" ? <PoloNewEnrollmentPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/students">
        {() => user?.portalType === "polo" ? <PoloStudentsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/reports">
        {() => user?.portalType === "polo" ? <PoloReportsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/settings">
        {() => user?.portalType === "polo" ? <PoloSettingsPage /> : <Redirect to="/polo" />}
      </Route>
      <Route path="/polo/sales-links">
        {() => user?.portalType === "polo" ? <PoloSalesLinksPage /> : <Redirect to="/polo" />}
      </Route>
      <ProtectedRoute path="/admin/dashboard" portalType="admin" />
      <Route path="/admin/disciplines">
        {() => user?.portalType === "admin" ? <DisciplinesPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/courses">
        {() => user?.portalType === "admin" ? <CoursesPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/disciplines/:id/content">
        {() => user?.portalType === "admin" ? <DisciplineContentPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/courses/new">
        {() => user?.portalType === "admin" ? <CourseFormPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/courses/edit/:id">
        {() => user?.portalType === "admin" ? <CourseFormPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/institutions">
        {() => user?.portalType === "admin" ? <InstitutionsPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/users">
        {() => user?.portalType === "admin" ? <UsersPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/users/new">
        {() => user?.portalType === "admin" ? <UsersPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/polos">
        {() => user?.portalType === "admin" ? <PolosPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/partners">
        {() => user?.portalType === "admin" ? <PartnersPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/financial">
        {() => user?.portalType === "admin" ? <FinancialPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/enrollments">
        {() => user?.portalType === "admin" ? <EnrollmentsPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/enrollments/new">
        {() => user?.portalType === "admin" ? <AdminNewEnrollmentPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/reports">
        {() => user?.portalType === "admin" ? <ReportsPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/integrations">
        {() => user?.portalType === "admin" ? <IntegrationsPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rota para acessar matrículas do polo a partir do admin */}
      <Route path="/admin/polo-enrollments">
        {() => user?.portalType === "admin" ? <PoloEnrollmentsPage /> : <Redirect to="/admin" />}
      </Route>
      
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
