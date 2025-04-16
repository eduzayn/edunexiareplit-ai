import React from "react";
import { useParams, useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  ClipboardIcon,
  TagIcon,
  CreditCardIcon,
  AlertCircleIcon,
  EditIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useContacts } from "@/hooks/use-crm";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { useClient } = useClients();
  const { data, isLoading, isError, error } = useClient(clientId);
  const { contacts } = useContacts(clientId);
  
  // Hook para excluir cliente
  const { deleteClient, isPendingDelete } = useClients();

  if (isError) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">
          <div className="flex items-center mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/crm/clients")}
              className="mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Erro</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircleIcon className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-medium mb-2">
                  Erro ao carregar dados do cliente
                </h2>
                <p className="text-gray-600 mb-6">
                  {error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao buscar os dados do cliente."}
                </p>
                <Button onClick={() => navigate("/admin/crm/clients")}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Voltar para a lista de clientes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      deleteClient(clientId, {
        onSuccess: () => {
          toast({
            title: "Cliente excluído",
            description: "O cliente foi excluído com sucesso.",
          });
          navigate("/admin/crm/clients");
        },
        onError: (err: any) => {
          toast({
            title: "Erro ao excluir cliente",
            description: err.message || "Ocorreu um erro ao excluir o cliente.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const getClientTypeBadge = (type: string) => {
    const typeMap: Record<string, React.ReactNode> = {
      pf: <Badge className="bg-blue-500">Pessoa Física</Badge>,
      pj: <Badge className="bg-purple-500">Pessoa Jurídica</Badge>,
    };

    return typeMap[type] || <Badge>{type}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/D";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/crm/clients")}
              className="mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? (
                  <Skeleton className="h-9 w-64" />
                ) : (
                  data?.client.name
                )}
              </h1>
              <p className="text-gray-500">
                {isLoading ? (
                  <Skeleton className="h-5 w-48 mt-1" />
                ) : (
                  `Cliente ${getClientTypeBadge(data?.client.type || "")}`
                )}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/crm/clients/edit/${clientId}`)}
              disabled={isLoading}
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || isPendingDelete}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {isLoading ? (
          // Estado de carregamento
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          // Conteúdo com os dados do cliente
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="contacts">Contatos</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="notes">Anotações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Dados principais do cliente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-y divide-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <UserIcon className="h-4 w-4 mr-2" />
                          Nome
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.name}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <ClipboardIcon className="h-4 w-4 mr-2" />
                          CPF/CNPJ
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.document}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <MailIcon className="h-4 w-4 mr-2" />
                          E-mail
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.email}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          Telefone
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.phone || "Não informado"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Data de Nascimento
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {formatDate(data?.client.birthDate) || "Não informado"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <TagIcon className="h-4 w-4 mr-2" />
                          Segmento
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.segment || "Não definido"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Data de Cadastro
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {formatDate(data?.client.createdAt)}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Endereço</CardTitle>
                    <CardDescription>
                      Informações de localização do cliente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-y divide-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          Endereço
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.address || "Não informado"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500">
                          Cidade
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.city || "Não informado"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500">
                          Estado
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.state || "Não informado"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500">
                          CEP
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.zipCode || "Não informado"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {data?.client.type === "pj" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações da Empresa</CardTitle>
                      <CardDescription>
                        Dados específicos para pessoa jurídica.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="divide-y divide-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                          <dt className="text-sm font-medium text-gray-500">
                            Contato Principal
                          </dt>
                          <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                            {data?.client.contactName || "Não informado"}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                          <dt className="text-sm font-medium text-gray-500">
                            E-mail do Contato
                          </dt>
                          <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                            {data?.client.contactEmail || "Não informado"}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                          <dt className="text-sm font-medium text-gray-500">
                            Telefone do Contato
                          </dt>
                          <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                            {data?.client.contactPhone || "Não informado"}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Integração</CardTitle>
                    <CardDescription>
                      Informações de integração com outros sistemas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-y divide-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <CreditCardIcon className="h-4 w-4 mr-2" />
                          ID no Asaas
                        </dt>
                        <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                          {data?.client.asaasId || "Não integrado"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <CardTitle>Contatos</CardTitle>
                    <CardDescription>
                      Lista de contatos adicionais relacionados a este cliente.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/admin/crm/clients/${clientId}/contacts/new`)}
                    className="mt-4 sm:mt-0"
                  >
                    Adicionar Contato
                  </Button>
                </CardHeader>
                <CardContent>
                  {contacts && contacts.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="py-4 flex flex-col sm:flex-row justify-between"
                        >
                          <div>
                            <h3 className="text-lg font-medium">{contact.name}</h3>
                            <p className="text-gray-500 text-sm">{contact.role}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm flex items-center">
                                <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {contact.email}
                              </p>
                              <p className="text-sm flex items-center">
                                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {contact.phone}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/admin/crm/clients/${clientId}/contacts/edit/${contact.id}`)
                              }
                            >
                              <EditIcon className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                // Implementar exclusão de contato
                                if (confirm("Tem certeza que deseja excluir este contato?")) {
                                  // deleteContact(contact.id)
                                }
                              }}
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <p className="text-gray-500 mb-4">
                        Nenhum contato adicional cadastrado para este cliente.
                      </p>
                      <Button
                        onClick={() => navigate(`/admin/crm/clients/${clientId}/contacts/new`)}
                      >
                        Adicionar Contato
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Financeiras</CardTitle>
                  <CardDescription>
                    Dados financeiros e de pagamento do cliente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                      <dt className="text-sm font-medium text-gray-500">
                        Condições de Pagamento
                      </dt>
                      <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                        {data?.client.paymentTerms || "Não definido"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 py-3">
                      <dt className="text-sm font-medium text-gray-500">
                        Limite de Crédito
                      </dt>
                      <dd className="sm:col-span-2 mt-1 sm:mt-0 text-sm text-gray-900">
                        {data?.client.creditLimit
                          ? `R$ ${data.client.creditLimit.toFixed(2).replace(".", ",")}`
                          : "Não definido"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Histórico Financeiro</h3>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-gray-500">
                        O histórico financeiro será implementado em uma próxima versão.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Anotações</CardTitle>
                  <CardDescription>
                    Observações e notas sobre o cliente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.client.notes ? (
                    <div className="prose max-w-none">
                      <p>{data.client.notes}</p>
                    </div>
                  ) : (
                    <div className="py-12 flex items-center justify-center">
                      <p className="text-gray-500">
                        Nenhuma anotação registrada para este cliente.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}