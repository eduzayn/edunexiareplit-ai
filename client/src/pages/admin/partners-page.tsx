import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchIcon, PlusIcon, EyeIcon, TrashIcon, EditIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function PartnersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: partners, isLoading } = useQuery({
    queryKey: ["/api/admin/partners", search],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Placeholder para dados de parceiros (normalmente viria da API)
  const placeholderPartners = [
    {
      id: 1,
      name: "Academia Fitness Pro",
      email: "contato@academiafitnesspro.com.br",
      phone: "(11) 98765-4321",
      status: "active",
      commission: 15,
      referrals: 48,
      joinedAt: "10/03/2023",
    },
    {
      id: 2,
      name: "Instituto Educacional Avançar",
      email: "parceria@avançar.edu.br",
      phone: "(21) 97654-3210",
      status: "active",
      commission: 20,
      referrals: 124,
      joinedAt: "22/06/2022",
    },
    {
      id: 3,
      name: "Escola Técnica FuturePro",
      email: "contato@futurepro.com.br",
      phone: "(31) 96543-2109",
      status: "pending",
      commission: 18,
      referrals: 0,
      joinedAt: "05/01/2024",
    },
    {
      id: 4,
      name: "Centro de Capacitação Profissional",
      email: "parcerias@ccp.org.br",
      phone: "(41) 95432-1098",
      status: "inactive",
      commission: 15,
      referrals: 36,
      joinedAt: "14/11/2022",
    },
    {
      id: 5,
      name: "Associação Educacional Brasil Futuro",
      email: "contato@brasilfuturo.org.br",
      phone: "(51) 94321-0987",
      status: "active",
      commission: 25,
      referrals: 78,
      joinedAt: "03/05/2023",
    },
  ];

  const renderPartnersTable = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    // Usar dados da API quando disponível, caso contrário use o placeholder
    const displayPartners = partners || placeholderPartners;

    return (
      <ScrollArea className="h-[calc(100vh-280px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Indicações</TableHead>
              <TableHead>Data de Entrada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(displayPartners) && displayPartners.map((partner: any) => (
              <TableRow key={partner.id}>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>{partner.email}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      partner.status === "active" 
                        ? "default" 
                        : partner.status === "pending" 
                          ? "secondary" 
                          : "destructive"
                    }
                    className={
                      partner.status === "active" 
                        ? "bg-green-500" 
                        : partner.status === "pending" 
                          ? "bg-yellow-500" 
                          : ""
                    }
                  >
                    {partner.status === "active" 
                      ? "Ativo" 
                      : partner.status === "pending" 
                        ? "Pendente" 
                        : "Inativo"
                    }
                  </Badge>
                </TableCell>
                <TableCell>{partner.commission}%</TableCell>
                <TableCell>{partner.referrals}</TableCell>
                <TableCell>{partner.joinedAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  // Cards de resumo
  const renderSummaryCards = () => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Parceiros</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">
              +5.2% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parceiros Ativos</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98</div>
            <p className="text-xs text-muted-foreground">
              79% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,482</div>
            <p className="text-xs text-muted-foreground">
              +12.3% em relação ao ano anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 245.680,00</div>
            <p className="text-xs text-muted-foreground">
              +18.7% em relação ao último trimestre
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        items={getAdminSidebarItems("/admin/partners")} 
        user={user}
        portalType="admin"
        portalColor="#4CAF50"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Gestão de Parceiros</h1>
                <p className="text-muted-foreground">Gerencie os parceiros da plataforma</p>
              </div>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Parceiro
              </Button>
            </div>

            {renderSummaryCards()}

            <Separator className="my-6" />

            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar parceiros..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {renderPartnersTable()}
          </div>
        </main>
      </div>
    </div>
  );
}