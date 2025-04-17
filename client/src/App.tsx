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
// Módulo Financeiro Empresarial
import FinanceiroEmpresarialPage from "@/pages/admin/financeiro-empresarial/index";
import AntecipacaoPage from "@/pages/admin/financeiro-empresarial/antecipacao-page";
import AssinaturasPage from "@/pages/admin/financeiro-empresarial/assinaturas-page";
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
// Importações de leads temporariamente removidas para reconstrução do módulo
// import LeadsPage from "@/pages/admin/crm/leads-page";
// import NewLeadPage from "@/pages/admin/crm/new-lead-page";
import LeadsV2Page from "@/pages/admin/crm/leads-v2-page";
import NewLeadV2Page from "@/pages/admin/crm/new-lead-v2-page";
import LeadDetailV2Page from "@/pages/admin/crm/lead-detail-v2-page";
import ClientsPage from "@/pages/admin/crm/clients-page";
import NewClientPage from "@/pages/admin/crm/new-client-page";
import ClientDetailsPage from "@/pages/admin/crm/client-details-page";
import ContactsPage from "@/pages/admin/crm/contacts-page";
import NewContactPage from "@/pages/admin/crm/new-contact-page";
import ProductsPage from "@/pages/admin/finance/products-page";
import NewProductPage from "@/pages/admin/finance/new-product-page";
import ChargesPage from "@/pages/admin/finance/charges-page";
import SimpleNewChargePage from "@/pages/admin/finance/simple-new-charge-page";
import AdvancedChargePage from "@/pages/admin/finance/advanced-charge-page";
import SubscriptionChargePage from "@/pages/admin/finance/subscription-charge-page";
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
import InstitutionSettingsPage from "@/pages/admin/sistema/institution-settings-page";
// Import polo pages
import PoloEnrollmentsPage from "@/pages/polo/enrollments-page";
import PoloNewEnrollmentPage from "@/pages/polo/new-enrollment-page";
import PoloStudentsPage from "@/pages/polo/students-page";
import PoloReportsPage from "@/pages/polo/reports-page";
import PoloSettingsPage from "@/pages/polo/settings-page";
import PoloSalesLinksPage from "@/pages/polo/sales-links-page";
// Páginas públicas de cobranças
import PublicChargesPage from "@/pages/public-charges";
import PublicCreateChargePage from "@/pages/public-create-charge";
import SimpleChargesPage from "@/pages/charges";
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
      <Route path="/test-page">
        {() => <div className="p-8 text-center">Página de Teste Funcionando!</div>}
      </Route>
      <Route path="/public-view/charges" component={SimpleChargesPage} />
      <Route path="/create-charge" component={PublicCreateChargePage} />
      
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
      
      {/* Rotas do Módulo Financeiro Empresarial */}
      <Route path="/admin/financeiro-empresarial">
        {() => user?.portalType === "admin" ? <FinanceiroEmpresarialPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/financeiro-empresarial/antecipacao">
        {() => user?.portalType === "admin" ? <AntecipacaoPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/financeiro-empresarial/assinaturas">
        {() => user?.portalType === "admin" ? <AssinaturasPage /> : <Redirect to="/admin" />}
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
      {/* Rotas de leads temporariamente removidas para reconstrução do módulo */}
      <Route path="/admin/crm/leads">
        {() => user?.portalType === "admin" ? <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Módulo de Leads em Reconstrução</h1>
          <p className="mb-2">Estamos reconstruindo o módulo de leads com integração ao Asaas Checkout.</p>
          <p className="mb-4">Esta nova versão permitirá enviar links de pagamento diretamente para leads e converter automaticamente em clientes após o pagamento.</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Durante a atualização, você pode continuar gerenciando clientes pela área de <a href="/admin/crm/clients" className="font-medium underline text-yellow-700 hover:text-yellow-600">Clientes</a>.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Teste a <a href="/admin/crm/leads-v2" className="font-medium underline text-blue-700 hover:text-blue-600">nova versão</a> do módulo de leads com integração Asaas. (Versão Prévia)
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Previsão de disponibilidade oficial: Em breve</p>
        </div> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/leads/new">
        {() => user?.portalType === "admin" ? <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Novo Sistema de Leads com Asaas Checkout</h1>
          <p className="mb-2">Estamos implementando um novo fluxo para captura e conversão de leads:</p>
          
          <ol className="list-decimal pl-8 mb-4 space-y-2">
            <li>Cadastro de leads com informações básicas</li>
            <li>Geração de links de pagamento do Asaas</li>
            <li>O lead recebe o link e completa seus próprios dados</li>
            <li>Após o pagamento, conversão automática para cliente</li>
          </ol>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Este novo sistema eliminará a necessidade de cobranças manuais e reduzirá erros de digitação de dados dos clientes.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">Obrigado pela sua paciência durante esta transição.</p>
        </div> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/checkout">
        {() => user?.portalType === "admin" ? <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Links de Checkout Asaas</h1>
          <p className="mb-4">A funcionalidade de geração de links de pagamento estará disponível em breve nesta área.</p>
          
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 2H8.828a2 2 0 00-1.414.586L6.293 3.707A1 1 0 015.586 4H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Principais benefícios:
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-green-700">
                  <li>Geração de links de pagamento personalizados</li>
                  <li>Cliente preenche os próprios dados no checkout</li>
                  <li>Acompanhamento de status em tempo real</li>
                  <li>Conversão automática para cliente após pagamento</li>
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">Previsão de disponibilidade: Em breve</p>
        </div> : <Redirect to="/admin" />}
      </Route>
      
      {/* Rotas da nova versão do módulo de leads (V2) */}
      <Route path="/admin/crm/leads-v2">
        {() => user?.portalType === "admin" ? <LeadsV2Page /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/leads/new-v2">
        {() => user?.portalType === "admin" ? <NewLeadV2Page /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/leads/:id/detail-v2">
        {() => user?.portalType === "admin" ? <LeadDetailV2Page /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/clients">
        {() => user?.portalType === "admin" ? <ClientsPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/clients/new">
        {() => user?.portalType === "admin" ? <NewClientPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/crm/clients/:id">
        {() => user?.portalType === "admin" ? <ClientDetailsPage /> : <Redirect to="/admin" />}
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
      
      <Route path="/admin/finance/charges">
        {() => user?.portalType === "admin" ? <ChargesPage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/charges/new">
        {() => user?.portalType === "admin" ? <SimpleNewChargePage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/charges/advanced">
        {() => user?.portalType === "admin" ? <AdvancedChargePage /> : <Redirect to="/admin" />}
      </Route>
      
      <Route path="/admin/finance/charges/subscription">
        {() => user?.portalType === "admin" ? <SubscriptionChargePage /> : <Redirect to="/admin" />}
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
      
      <Route path="/admin/sistema/institution-settings">
        {() => user?.portalType === "admin" ? <InstitutionSettingsPage /> : <Redirect to="/admin" />}
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
