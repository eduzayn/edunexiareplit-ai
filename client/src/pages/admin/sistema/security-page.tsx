import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";

// Componente DataTable simplificado
function DataTable({ data, columns, searchColumn, filterColumn }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder={`Buscar por ${searchColumn}...`}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Filtrar</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem checked>
              Todos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>
              Ativos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>
              Inativos
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.id}>{row[column.accessorKey]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Definição das colunas para cada tabela
const permissionColumns = [
  { id: "name", header: "Nome", accessorKey: "name" },
  { id: "description", header: "Descrição", accessorKey: "description" },
  { id: "type", header: "Tipo", accessorKey: "type" },
  { id: "status", header: "Status", accessorKey: "status" },
];

const rolesColumns = [
  { id: "name", header: "Nome", accessorKey: "name" },
  { id: "description", header: "Descrição", accessorKey: "description" },
  { id: "type", header: "Tipo", accessorKey: "type" },
  { id: "status", header: "Status", accessorKey: "status" },
];

const userColumns = [
  { id: "name", header: "Nome", accessorKey: "name" },
  { id: "email", header: "Email", accessorKey: "email" },
  { id: "role", header: "Papel", accessorKey: "role" },
  { id: "status", header: "Status", accessorKey: "status" },
  { id: "lastLogin", header: "Último Login", accessorKey: "lastLogin" },
];

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["/api/permissions"],
    enabled: activeTab === "permissions",
  });

  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["/api/roles"],
    enabled: activeTab === "roles",
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: activeTab === "users",
  });

  const runSecurityAudit = () => {
    toast({
      title: "Auditoria de segurança iniciada",
      description: "Verificando configurações de segurança e permissões",
    });
    // Implementar chamada para iniciar auditoria de segurança
  };

  const updateSecuritySettings = () => {
    toast({
      title: "Configurações de segurança atualizadas",
      description: "As configurações de segurança foram atualizadas com sucesso",
    });
    // Implementar chamada para atualizar configurações de segurança
  };

  return (
    <AdminLayout>
      <title>Segurança | EdunexIA</title>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Segurança</h1>
        <div className="flex space-x-4">
          <Button onClick={runSecurityAudit} variant="outline">
            Executar Auditoria
          </Button>
          <Button onClick={updateSecuritySettings}>
            Atualizar Configurações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="roles">Papéis</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="authentication">Autenticação</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral de Segurança</CardTitle>
                <CardDescription>Status atual do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Status do Sistema</span>
                    <span className="text-green-500 font-semibold">Seguro</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última Auditoria</span>
                    <span>14/04/2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Problemas Encontrados</span>
                    <span>0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Usuários</span>
                    <span>358</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuários Ativos</span>
                    <span>320</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autenticação</CardTitle>
                <CardDescription>Configurações de login</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Multi-fator</span>
                    <span className="text-orange-500 font-semibold">Parcial</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo de Sessão</span>
                    <span>8 horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Política de Senhas</span>
                    <span className="text-green-500 font-semibold">Forte</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Login Social</span>
                    <span>Habilitado</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bloqueio por Tentativas</span>
                    <span>Ativo (5 tentativas)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Logins</span>
                    <span>73</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Falhas de Login</span>
                    <span className="text-orange-500 font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contas Bloqueadas</span>
                    <span className="text-red-500 font-semibold">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alterações de Permissão</span>
                    <span>5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mudanças de Senha</span>
                    <span>8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          {isLoadingPermissions ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              columns={permissionColumns} 
              data={permissions || []} 
              searchColumn="name"
              filterColumn="type"
            />
          )}
        </TabsContent>

        <TabsContent value="roles">
          {isLoadingRoles ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              columns={rolesColumns} 
              data={roles || []} 
              searchColumn="name"
              filterColumn="type"
            />
          )}
        </TabsContent>

        <TabsContent value="users">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              columns={userColumns} 
              data={users || []} 
              searchColumn="name"
              filterColumn="status"
            />
          )}
        </TabsContent>

        <TabsContent value="authentication">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Autenticação</CardTitle>
              <CardDescription>
                Gerencie como os usuários acessam o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Provedores de Autenticação</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure quais métodos de login estão disponíveis para os usuários
                    </p>
                    <div className="space-y-2 mt-2">
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span>Email e senha (padrão)</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span>Google</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span>Microsoft</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span>Apple</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Autenticação de Dois Fatores</h3>
                    <p className="text-sm text-muted-foreground">
                      Controle quais grupos de usuários precisam usar autenticação de dois fatores
                    </p>
                    <div className="space-y-2 mt-2">
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span>Administradores</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span>Coordenadores</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span>Gestores de Polo</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span>Alunos</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Segurança</CardTitle>
              <CardDescription>Histórico de eventos de segurança</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left">Data/Hora</th>
                        <th scope="col" className="px-6 py-3 text-left">Usuário</th>
                        <th scope="col" className="px-6 py-3 text-left">Ação</th>
                        <th scope="col" className="px-6 py-3 text-left">IP</th>
                        <th scope="col" className="px-6 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white border-b hover:bg-muted/50">
                        <td className="px-6 py-4">15/04/2025 10:45:23</td>
                        <td className="px-6 py-4">admin@edunexia.com</td>
                        <td className="px-6 py-4">Login</td>
                        <td className="px-6 py-4">192.168.1.105</td>
                        <td className="px-6 py-4"><span className="text-green-500">Sucesso</span></td>
                      </tr>
                      <tr className="bg-white border-b hover:bg-muted/50">
                        <td className="px-6 py-4">15/04/2025 10:44:56</td>
                        <td className="px-6 py-4">coordenador@edunexia.com</td>
                        <td className="px-6 py-4">Alteração de permissão</td>
                        <td className="px-6 py-4">192.168.1.42</td>
                        <td className="px-6 py-4"><span className="text-green-500">Sucesso</span></td>
                      </tr>
                      <tr className="bg-white border-b hover:bg-muted/50">
                        <td className="px-6 py-4">15/04/2025 10:43:12</td>
                        <td className="px-6 py-4">usuario@exemplo.com</td>
                        <td className="px-6 py-4">Login</td>
                        <td className="px-6 py-4">187.54.32.101</td>
                        <td className="px-6 py-4"><span className="text-red-500">Falha</span></td>
                      </tr>
                      <tr className="bg-white border-b hover:bg-muted/50">
                        <td className="px-6 py-4">15/04/2025 10:41:45</td>
                        <td className="px-6 py-4">financeiro@edunexia.com</td>
                        <td className="px-6 py-4">Criação de usuário</td>
                        <td className="px-6 py-4">192.168.1.87</td>
                        <td className="px-6 py-4"><span className="text-green-500">Sucesso</span></td>
                      </tr>
                      <tr className="bg-white border-b hover:bg-muted/50">
                        <td className="px-6 py-4">15/04/2025 10:40:33</td>
                        <td className="px-6 py-4">polo@edunexia.com</td>
                        <td className="px-6 py-4">Redefinição de senha</td>
                        <td className="px-6 py-4">201.45.67.89</td>
                        <td className="px-6 py-4"><span className="text-green-500">Sucesso</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}