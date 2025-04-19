import React, { useState, useEffect } from 'react';
import { SearchIcon, UsersIcon, Loader2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface CustomerData {
  name: string;
  email: string;
  document: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface CpfCustomerSearchProps {
  onCustomerSelect: (customerData: CustomerData) => void;
}

export function CpfCustomerSearch({ onCustomerSelect }: CpfCustomerSearchProps) {
  const { toast } = useToast();
  const [cpf, setCpf] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Função para formatar CPF (000.000.000-00)
  const formatCpf = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3)}`;
    if (digitsOnly.length <= 9) return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6)}`;
    return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6, 9)}-${digitsOnly.slice(9, 11)}`;
  };

  // Handler para o campo de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(e.target.value);
    setCpf(formattedCpf);
  };

  // Query para buscar cliente no Asaas
  const { 
    data: customerData, 
    refetch: searchCustomer,
    isFetching,
    error: searchError
  } = useQuery({
    queryKey: ['asaas', 'customer', cpf],
    queryFn: async () => {
      // Remova a formatação do CPF
      const cleanCpf = cpf.replace(/\D/g, '');
      
      if (cleanCpf.length < 11) {
        throw new Error('CPF incompleto');
      }
      
      console.log(`[Frontend] Buscando cliente com CPF: ${cleanCpf}`);
      
      try {
        // Obter a resposta como objeto Response
        const response = await apiRequest(
          `/api/asaas/customers/search?cpfCnpj=${cleanCpf}`,
          { method: 'GET' }
        );
        
        // Converter a resposta para JSON
        const jsonData = await response.json();
        
        console.log("[Frontend] Resposta da API:", jsonData);
        
        // Verificação de segurança para garantir uma resposta válida
        if (!jsonData) {
          console.error("[Frontend] Resposta vazia da API");
          throw new Error("Resposta vazia da API");
        }
        
        console.log("[Frontend] Analisando estrutura da resposta:", JSON.stringify(jsonData));
        
        // Verificar se a resposta é um objeto vazio
        if (Object.keys(jsonData).length === 0) {
          console.log("[Frontend] A API retornou um objeto vazio, consideramos como cliente não encontrado");
          return {
            success: true,
            data: null,
            message: 'Cliente não encontrado no Asaas'
          };
        }
        
        // Verificar qual formato de resposta recebemos
        if (jsonData.success === true) {
          console.log("[Frontend] Resposta no formato padrão da nossa API");
          
          // Se tiver data, verificamos se é um objeto vazio
          if (jsonData.data && Object.keys(jsonData.data).length === 0) {
            console.log("[Frontend] Objeto data está vazio, consideramos como cliente não encontrado");
            return {
              success: true,
              data: null,
              message: 'Cliente não encontrado no Asaas'
            };
          }
          
          return jsonData;
        } else if (jsonData.id && jsonData.name && jsonData.cpfCnpj) {
          // A resposta parece ser um objeto direto do Asaas
          console.log("[Frontend] Detectado formato direto do Asaas, adaptando...");
          return {
            success: true,
            data: jsonData,
            message: 'Cliente encontrado no Asaas'
          };
        } else if (jsonData.message === "Usuário não autenticado") {
          console.error("[Frontend] Usuário não autenticado");
          throw new Error("Usuário não autenticado. Faça login novamente.");
        } else {
          console.log("[Frontend] Resposta não contém dados de cliente, considerando como não encontrado");
          return {
            success: true,
            data: null,
            message: 'Cliente não encontrado no Asaas'
          };
        }
      } catch (error) {
        console.error("[Frontend] Erro ao buscar cliente:", error);
        throw error;
      }
    },
    enabled: false, // Não executa automaticamente
    retry: 1
  });

  // Handler para o botão de busca
  const handleSearch = async () => {
    setIsSearching(true);
    
    try {
      await searchCustomer();
    } catch (error) {
      toast({
        title: 'Erro ao buscar cliente',
        description: 'Não foi possível buscar o cliente no Asaas.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Função para limpar a consulta
  const resetCustomerSearch = () => {
    queryClient.removeQueries({queryKey: ['asaas', 'customer', cpf]});
    setCpf('');
  };

  // Handler para selecionar o cliente
  const handleSelectCustomer = () => {
    if (customerData?.data) {
      // Mapeia os dados do cliente do Asaas para o formato esperado pelo componente pai
      const mappedCustomer: CustomerData = {
        name: customerData.data.name,
        email: customerData.data.email,
        document: customerData.data.cpfCnpj,
        phone: customerData.data.mobilePhone || customerData.data.phone,
        address: customerData.data.address,
        city: customerData.data.city,
        state: customerData.data.state,
        zipCode: customerData.data.postalCode
      };
      
      // Chama a função de callback passando os dados do cliente
      onCustomerSelect(mappedCustomer);
      
      // Limpa a busca
      resetCustomerSearch();
    }
  };

  // Efetua a busca quando o CPF tiver 14 caracteres (com a formatação)
  useEffect(() => {
    if (cpf.length === 14) {
      handleSearch();
    }
  }, [cpf]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Digite o CPF do aluno"
            className="pl-9 pr-4"
            value={cpf}
            onChange={handleCpfChange}
            maxLength={14}
          />
          {isFetching && (
            <Loader2Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
          )}
        </div>
        <Button 
          type="button" 
          onClick={handleSearch}
          disabled={cpf.length < 11 || isFetching}
          variant="outline"
        >
          Buscar
        </Button>
      </div>

      {/* Verifica se há dados válidos do cliente de diferentes formas */}
      {customerData && (
        <>
          {/* Debugar a estrutura dos dados */}
          {console.log("Renderizando componente com dados:", customerData)}
          
          {/* Caso 1: success + data (formato padrão) */}
          {customerData.success === true && customerData.data && (
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <UsersIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">Cliente encontrado no Asaas</span>
                    </div>
                    <h3 className="font-semibold text-lg">{customerData.data.name}</h3>
                    <p className="text-sm text-muted-foreground">{customerData.data.email}</p>
                    <p className="text-sm text-muted-foreground">{formatCpf(customerData.data.cpfCnpj)}</p>
                    {customerData.data.mobilePhone && (
                      <p className="text-sm text-muted-foreground">{customerData.data.mobilePhone}</p>
                    )}
                  </div>
                  <Button variant="default" size="sm" onClick={handleSelectCustomer}>
                    Usar este cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Caso 2: cliente vem diretamente na raiz da resposta (da API específica) */}
          {!customerData.success && customerData.id && customerData.name && (
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <UsersIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">Cliente encontrado no Asaas</span>
                    </div>
                    <h3 className="font-semibold text-lg">{customerData.name}</h3>
                    <p className="text-sm text-muted-foreground">{customerData.email}</p>
                    <p className="text-sm text-muted-foreground">{formatCpf(customerData.cpfCnpj)}</p>
                    {customerData.mobilePhone && (
                      <p className="text-sm text-muted-foreground">{customerData.mobilePhone}</p>
                    )}
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => {
                      // Cria um objeto adaptado diretamente
                      const customer: CustomerData = {
                        name: customerData.name,
                        email: customerData.email,
                        document: customerData.cpfCnpj,
                        phone: customerData.mobilePhone || customerData.phone,
                        address: customerData.address,
                        city: customerData.city,
                        state: customerData.state,
                        zipCode: customerData.postalCode
                      };
                      // Passa diretamente para o callback
                      onCustomerSelect(customer);
                      resetCustomerSearch();
                    }}
                  >
                    Usar este cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Caso 3: Nenhum cliente encontrado */}
          {customerData.success === true && !customerData.data && (
            <div className="text-sm text-muted-foreground py-2 px-3 bg-muted/30 rounded-md">
              Nenhum cliente encontrado com este CPF. Preencha os dados para criar um novo cadastro.
            </div>
          )}
        </>
      )}
    </div>
  );
}