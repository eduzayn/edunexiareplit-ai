import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/landing/not-found";
import HomePage from "@/pages/landing/home-page";
import AuthPage from "@/pages/autenticacao/auth-page";
import PortalSelectionPage from "@/pages/autenticacao/portal-selection-page";
import ModulosPage from "@/pages/landing/modulos-page";
import PlanosPage from "@/pages/landing/planos-page";
import CadastroPage from "@/pages/cadastro/cadastro-page";
import CadastroSucessoPage from "@/pages/cadastro/cadastro-sucesso-page";
import SobrePage from "@/pages/landing/sobre-page";
import ContatoPage from "@/pages/landing/contato-page";
import BlogPage from "@/pages/landing/blog-page";
import PrivacidadePage from "@/pages/institucional/privacidade-page";
import AdminAuthPage from "@/pages/autenticacao/admin-auth-page";
import PoloAuthPage from "@/pages/autenticacao/polo-auth-page";
import DisciplinesPage from "@/pages/admin/academico/disciplines-page";
import CoursesPage from "@/pages/admin/academico/courses-page";
import CourseFormPage from "@/pages/admin/academico/course-form-page";
import DisciplineContentPage from "@/pages/admin/academico/discipline-content-page";
import InstitutionsPage from "@/pages/admin/institucional/institutions-page";
// import UsersPage from "@/pages/admin/users-page";
import PolosPage from "@/pages/admin/institucional/polos-page";
import PartnersPage from "@/pages/admin/institucional/partners-page";
import FinancialPage from "@/pages/admin/finance/financial-page";
import ReportsPage from "@/pages/admin/relatorios/reports-page";
import NewReportsPage from "@/pages/admin/relatorios/new-reports-page";
// Módulo de Matrículas
import EnrollmentsPage from "@/pages/admin/matriculas/enrollments-page";
import NewEnrollmentPage from "@/pages/admin/matriculas/new-enrollment-page";
import AdminPoloNewEnrollmentPage from "@/pages/admin/matriculas/admin-polo-new-enrollment-page";
import PoloEnrollmentsPageAdmin from "@/pages/admin/matriculas/polo-enrollments-page";
import IntegrationsPage from "@/pages/admin/integracoes/integrations-page";
import CertificationTemplatesPage from "@/pages/admin/certification/templates-page";
import CertificationIssuePage from "@/pages/admin/certification/issue-page";
import CertificationSignersPage from "@/pages/admin/certification/signers-page";
// Importação dos módulos CRM e Gestão
import LeadsPage from "@/pages/admin/crm/leads-page";
import NewLeadPage from "@/pages/admin/crm/new-lead-page";
import ClientsPage from "@/pages/admin/crm/clients-page";
import NewClientPage from "@/pages/admin/crm/new-client-page";
import ContactsPage from "@/pages/admin/crm/contacts-page";
import NewContactPage from "@/pages/admin/crm/new-contact-page";
import ProductsPage from "@/pages/admin/finance/products-page";
import NewProductPage from "@/pages/admin/finance/new-product-page";
import InvoicesPage from "@/pages/admin/finance/invoices-page";
import NewInvoicePage from "@/pages/admin/finance/new-invoice-page";
import PaymentsPage from "@/pages/admin/finance/payments-page";
import NewPaymentPage from "@/pages/admin/finance/new-payment-page";
import ContractsPage from "@/pages/admin/contracts";
import NewContractPage from "@/pages/admin/contracts/new-contract-page";
// Módulo de Comunicação
import InboxPage from "@/pages/admin/inbox";
// Módulo de Pessoas
import RolesPage from "@/pages/admin/pessoas/roles-page";
import RoleDetailPage from "@/pages/admin/pessoas/role-detail-page";
import AbacPermissionsPage from "@/pages/admin/pessoas/abac-permissions-page";
import UsuariosPage from "@/pages/admin/pessoas/usuarios-page";
import UsuarioFormPage from "@/pages/admin/pessoas/usuario-form-page";
// Módulo de Auditoria
import LogsAuditoriaPage from "@/pages/admin/auditoria/logs-auditoria-page";
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
// Módulo de Sistema
import SecurityPage from "@/pages/admin/sistema/security-page";
import SettingsPage from "@/pages/admin/sistema/settings-page";
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
            // Substituir setLocation diretamente por um componente de redirecionamento
            return <Redirect to={dashboardPath} />;
          }
          return <AuthPage />;
        }}
      </Route>
      <Route path="/portal-selection" component={PortalSelectionPage} />
      <Route path="/admin">
        {() => {
          if (user && user.portalType === "admin") {
            return <Redirect to="/admin/dashboard" />;
          }
          return <AdminAuthPage />;
        }}
      </Route>
      
      <Route path="/polo">
        {() => {
          if (user && user.portalType === "polo") {
            return <Redirect to="/polo/dashboard" />;
          }
          return <PoloAuthPage />;
        }}
      </Route>
      
      <Route path="/modulos" component={ModulosPage} />
      <Route path="/planos" component={PlanosPage} />
      <Route path="/cadastro" component={CadastroPage} />
      <Route path="/cadastro-sucesso" component={CadastroSucessoPage} />
      <Route path="/sobre" component={SobrePage} />
      <Route path="/contato" component={ContatoPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/privacidade" component={PrivacidadePage} />
      
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
      {/* Rotas de usuários removidas temporariamente */}
      {/* <Route path="/admin/users" exact>
        {() => user?.portalType === "admin" ? <div>Em desenvolvimento</div> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/users/new">
        {() => user?.portalType === "admin" ? <div>Em desenvolvimento</div> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/users/:id">
        {() => user?.portalType === "admin" ? <div>Em desenvolvimento</div> : <Redirect to="/admin" />}
      </Route> */}
      <Route path="/admin/polos">
        {() => user?.portalType === "admin" ? <PolosPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/partners">
        {() => user?.portalType === "admin" ? <PartnersPage /> : <Redirect to="/admin" />}
      </Route>
      <Route path="/admin/financial">
        {() => user?.portalType === "admin" ? <FinancialPage /> : <Redirect to="/admin" />}
      </Route>
      {/* Rotas do Módulo de Matrículas */}
      <Route path="/admin/enrollments">
        {() => user?.portalType === "admin" ? <EnrollmentsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/enrollments/new">
        {() => user?.portalType === "admin" ? <NewEnrollmentPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/polo-enrollments">
        {() => user?.portalType === "admin" ? <PoloEnrollmentsPageAdmin /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/polo-enrollments/new">
        {() => user?.portalType === "admin" ? <AdminPoloNewEnrollmentPage /> : <Redirect to="/admin" />}
      </Route>
      {/* Rotas do Módulo de Relatórios */}
      <Route path="/admin/reports">
        {() => user?.portalType === "admin" ? <ReportsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/reports/new">
        {() => user?.portalType === "admin" ? <NewReportsPage /> : <Redirect to="/admin" />}
      </Route>
      {/* Rotas do Módulo de Integrações */}
      <Route path="/admin/integrations">
        {() => user?.portalType === "admin" ? <IntegrationsPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo de Certificação */}
      <Route path="/admin/certification/templates">
        {() => user?.portalType === "admin" ? <CertificationTemplatesPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/certification/issue">
        {() => user?.portalType === "admin" ? <CertificationIssuePage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/certification/signers">
        {() => user?.portalType === "admin" ? <CertificationSignersPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo CRM */}
      <Route path="/admin/crm/leads">
        {() => user?.portalType === "admin" ? <LeadsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/leads/new">
        {() => user?.portalType === "admin" ? <NewLeadPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/clients">
        {() => user?.portalType === "admin" ? <ClientsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/clients/new">
        {() => user?.portalType === "admin" ? <NewClientPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/contacts">
        {() => user?.portalType === "admin" ? <ContactsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/contacts/new">
        {() => user?.portalType === "admin" ? <NewContactPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo Financeiro */}
      <Route path="/admin/finance/products">
        {() => user?.portalType === "admin" ? <ProductsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/products/new">
        {() => user?.portalType === "admin" ? <NewProductPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/invoices">
        {() => user?.portalType === "admin" ? <InvoicesPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/invoices/new">
        {() => user?.portalType === "admin" ? <NewInvoicePage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/payments">
        {() => user?.portalType === "admin" ? <PaymentsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/payments/new">
        {() => user?.portalType === "admin" ? <NewPaymentPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo de Comunicação */}
      <Route path="/admin/comunicacao/inbox">
        {() => user?.portalType === "admin" ? <InboxPage /> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/comunicacao/whatsapp">
        {() => user?.portalType === "admin" ? <div>Em breve</div> : <Redirect to="/admin" />}
      </Route>

      <Route path="/admin/comunicacao/email">
        {() => user?.portalType === "admin" ? <div>Em breve</div> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo de Contratos */}
      <Route path="/admin/contratos/contratos">
        {() => user?.portalType === "admin" ? <ContractsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/contratos/contratos/new">
        {() => user?.portalType === "admin" ? <NewContractPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo de Pessoas */}
      <Route path="/admin/pessoas/roles">
        {() => user?.portalType === "admin" ? <RolesPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/pessoas/roles/:id">
        {() => user?.portalType === "admin" ? <RoleDetailPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/pessoas/abac-permissions">
        {() => user?.portalType === "admin" ? <AbacPermissionsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/pessoas/usuarios">
        {() => user?.portalType === "admin" ? <UsuariosPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/pessoas/usuarios/new">
        {() => user?.portalType === "admin" ? <UsuarioFormPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/pessoas/usuarios/:id">
        {() => user?.portalType === "admin" ? <UsuarioFormPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo de Auditoria */}
      <Route path="/admin/auditoria/logs">
        {() => user?.portalType === "admin" ? <LogsAuditoriaPage /> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas do Módulo de Sistema */}
      <Route path="/admin/sistema/security">
        {() => user?.portalType === "admin" ? <SecurityPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/sistema/settings">
        {() => user?.portalType === "admin" ? <SettingsPage /> : <Redirect to="/admin" />}
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
