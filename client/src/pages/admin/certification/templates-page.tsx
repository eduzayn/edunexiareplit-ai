import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfoIcon, PlusIcon, ScrollTextIcon, FileCheckIcon, PencilIcon, EyeIcon, DownloadIcon, TrashIcon } from "@/components/ui/icons";

// Página de gerenciamento de templates de certificados
export default function CertificationTemplatesPage() {
  const { toast } = useToast();
  const [openNewTemplateDialog, setOpenNewTemplateDialog] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("pos-graduacao");
  
  // Dados de exemplo para templates (Será substituído por chamada à API)
  const templateExamples = {
    "pos-graduacao": [
      {
        id: 1,
        name: "Template Padrão - Pós-Graduação",
        description: "Certificado oficial para conclusão de cursos de pós-graduação",
        previewImage: "/templates/pos-grad-preview.png",
        isDefault: true,
        lastModified: "10/03/2025",
        status: "active"
      },
      {
        id: 2,
        name: "Template Alternativo - Pós-Graduação",
        description: "Layout alternativo para certificados de pós-graduação",
        previewImage: "/templates/pos-grad-alt-preview.png",
        isDefault: false,
        lastModified: "15/02/2025",
        status: "active"
      }
    ],
    "formacao-livre": [
      {
        id: 3,
        name: "Template Padrão - Formação Livre",
        description: "Certificado para cursos de formação livre e extensão",
        previewImage: "/templates/extension-preview.png",
        isDefault: true,
        lastModified: "05/01/2025",
        status: "active"
      }
    ]
  };
  
  // Mock de função para criar um novo template
  const handleCreateTemplate = (data: any) => {
    toast({
      title: "Template criado com sucesso",
      description: `Template "${data.name}" adicionado ao sistema.`,
    });
    setOpenNewTemplateDialog(false);
  };
  
  // Componente para o formulário de criação de novo template
  const NewTemplateForm = () => {
    const [templateName, setTemplateName] = React.useState("");
    const [templateDescription, setTemplateDescription] = React.useState("");
    const [templateType, setTemplateType] = React.useState("pos-graduacao");
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleCreateTemplate({
        name: templateName,
        description: templateDescription,
        type: templateType
      });
    };
    
    return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Tipo de Curso
            </Label>
            <select 
              id="type"
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="col-span-3 p-2 border rounded-md"
              required
            >
              <option value="pos-graduacao">Pós-Graduação</option>
              <option value="formacao-livre">Formação Livre</option>
            </select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Arquivo Template
            </Label>
            <Input
              id="file"
              type="file"
              accept=".html,.pdf"
              className="col-span-3"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpenNewTemplateDialog(false)}
          >
            Cancelar
          </Button>
          <Button type="submit">Criar Template</Button>
        </DialogFooter>
      </form>
    );
  };
  
  // Componente de card para exibir um template
  const TemplateCard = ({ template }: { template: any }) => {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.isDefault && (
              <Badge variant="default">Padrão</Badge>
            )}
          </div>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-md p-2 mb-3 h-40 flex justify-center items-center">
            <ScrollTextIcon className="w-16 h-16 text-gray-400" />
            {/* Quando tiver previews de templates: */}
            {/* <img 
              src={template.previewImage} 
              alt={`Preview de ${template.name}`} 
              className="max-h-full object-contain"
            /> */}
          </div>
          <div className="text-sm text-gray-500">
            <p>Última modificação: {template.lastModified}</p>
            <p>Status: {template.status === "active" ? "Ativo" : "Inativo"}</p>
          </div>
        </CardContent>
        <CardFooter className="pt-1 gap-2 flex">
          <Button size="sm" variant="outline">
            <EyeIcon className="mr-1 h-4 w-4" />
            Visualizar
          </Button>
          <Button size="sm" variant="outline">
            <PencilIcon className="mr-1 h-4 w-4" />
            Editar
          </Button>
          <Button size="sm" variant="outline">
            <DownloadIcon className="mr-1 h-4 w-4" />
            Baixar
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates de Certificados</h1>
            <p className="text-muted-foreground">
              Gerencie os modelos de certificados que serão emitidos aos alunos.
            </p>
          </div>
          <Dialog open={openNewTemplateDialog} onOpenChange={setOpenNewTemplateDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Template de Certificado</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo template de certificado. Você poderá fazer o upload de um arquivo HTML ou PDF.
                </DialogDescription>
              </DialogHeader>
              <NewTemplateForm />
            </DialogContent>
          </Dialog>
        </div>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Dica</AlertTitle>
          <AlertDescription>
            Os templates de certificado suportam variáveis dinâmicas como {"{nome_aluno}"}, {"{nome_curso}"}, {"{carga_horaria}"}, que serão substituídas automaticamente durante a emissão.
          </AlertDescription>
        </Alert>
        
        <Tabs 
          defaultValue="pos-graduacao" 
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="pos-graduacao">
              Pós-Graduação
            </TabsTrigger>
            <TabsTrigger value="formacao-livre">
              Formação Livre
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pos-graduacao" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templateExamples["pos-graduacao"].map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="formacao-livre" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templateExamples["formacao-livre"].map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}