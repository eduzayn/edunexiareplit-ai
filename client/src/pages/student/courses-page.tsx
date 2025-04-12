import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  ClockIcon,
  SearchIcon,
  SortIcon,
  FilterIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/student/courses"],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Sidebar items for student portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <MenuBookIcon />, active: true, href: "/student/courses" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/student/calendar" },
    { name: "Documentos", icon: <DescriptionIcon />, href: "/student/documents" },
    { name: "Financeiro", icon: <PaymentsIcon />, href: "/student/financial" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/student/support" },
  ];

  // Filter and sort courses
  const filteredCourses = courses
    ? courses
        .filter((course) => {
          // Apply search filter
          if (searchTerm && !course.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
          
          // Apply status filter
          if (filterStatus === "inProgress" && course.progress >= 100) return false;
          if (filterStatus === "completed" && course.progress < 100) return false;
          if (filterStatus === "notStarted" && course.progress > 0) return false;
          
          return true;
        })
        .sort((a, b) => {
          // Apply sorting
          if (sortBy === "name") return a.name.localeCompare(b.name);
          if (sortBy === "progress") return b.progress - a.progress;
          if (sortBy === "recent") return new Date(b.updatedAt) - new Date(a.updatedAt);
          return 0;
        })
    : [];

  // Status badge for each course
  const getStatusBadge = (progress) => {
    if (progress === 0) return <Badge variant="outline">Não iniciado</Badge>;
    if (progress < 100) return <Badge variant="secondary">Em andamento</Badge>;
    return <Badge variant="success">Concluído</Badge>;
  };

  // Button text based on progress
  const getButtonText = (progress) => {
    if (progress === 0) return "Começar";
    if (progress < 100) return "Continuar";
    return "Revisar";
  };

  // Random background colors for course cards
  const getRandomColor = (index) => {
    const colors = [
      "bg-primary-light",
      "bg-green-200",
      "bg-orange-200",
      "bg-blue-200",
      "bg-purple-200",
      "bg-pink-200",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#12B76A"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Meus Cursos</h1>
            <p className="text-gray-600">Gerencie e acesse todos os seus cursos</p>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-1/3"
              icon={<SearchIcon className="h-4 w-4" />}
            />
            <div className="flex gap-4 flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-40">
                  <div className="flex items-center">
                    <FilterIcon className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar por" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  <SelectItem value="inProgress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="notStarted">Não iniciados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-40">
                  <div className="flex items-center">
                    <SortIcon className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Ordenar por" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome (A-Z)</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <div className="h-36 bg-gray-200 animate-pulse" />
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-40 mb-1" />
                        <Skeleton className="h-4 w-32 mb-3" />
                        <Skeleton className="h-2 w-full mb-3" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
              : filteredCourses.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <MenuBookIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum curso encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterStatus !== "all"
                      ? "Tente ajustar seus filtros de busca"
                      : "Você ainda não tem cursos disponíveis"}
                  </p>
                  {(searchTerm || filterStatus !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                filteredCourses.map((course, index) => (
                  <Card key={course.id} className="overflow-hidden">
                    <div className={`h-36 ${getRandomColor(index)} flex items-center justify-center`}>
                      <MenuBookIcon className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">{course.name}</h3>
                        {getStatusBadge(course.progress)}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Carga horária: {course.workload || 0} horas</span>
                      </div>
                      <Progress value={course.progress} className="h-2 mb-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {course.progress === 0
                            ? "Não iniciado"
                            : course.progress === 100
                            ? "Concluído"
                            : `Progresso: ${course.progress}%`}
                        </span>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          asChild
                        >
                          <Link to={`/student/courses/${course.id}`}>
                            {getButtonText(course.progress)}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          </div>
        </div>
      </div>
    </div>
  );
}