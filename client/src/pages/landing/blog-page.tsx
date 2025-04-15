import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/components/ui/icons";

export default function BlogPage() {
  const [, navigate] = useLocation();
  
  const handleLogin = () => {
    navigate("/portal-selection");
  };

  const posts = [
    {
      title: "Como implementar ensino híbrido na sua instituição",
      excerpt: "Descubra estratégias eficazes para integrar o ensino presencial e online em uma experiência educacional completa.",
      date: "12 Abr 2025",
      category: "Educação",
      image: "bg-blue-100"
    },
    {
      title: "Inteligência Artificial na personalização do aprendizado",
      excerpt: "Conheça as últimas inovações em IA e como elas estão transformando a experiência dos alunos no ensino a distância.",
      date: "05 Abr 2025",
      category: "Tecnologia",
      image: "bg-purple-100"
    },
    {
      title: "Gestão de polos: desafios e oportunidades",
      excerpt: "Aprenda as melhores práticas para gerenciar polos educacionais e maximizar o alcance da sua instituição.",
      date: "28 Mar 2025",
      category: "Gestão",
      image: "bg-green-100"
    },
    {
      title: "O futuro da certificação digital na educação",
      excerpt: "Como blockchain e outras tecnologias estão revolucionando a emissão e validação de certificados educacionais.",
      date: "20 Mar 2025",
      category: "Inovação",
      image: "bg-orange-100"
    },
    {
      title: "Estratégias de engajamento para cursos online",
      excerpt: "Técnicas comprovadas para aumentar a participação e reduzir a evasão em ambientes virtuais de aprendizagem.",
      date: "15 Mar 2025",
      category: "Pedagogia",
      image: "bg-red-100"
    },
    {
      title: "Tendências em educação para 2025",
      excerpt: "Um panorama completo das principais tendências que moldarão o futuro da educação nos próximos anos.",
      date: "08 Mar 2025",
      category: "Tendências",
      image: "bg-teal-100"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={handleLogin} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gray-50 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Blog EdunexIA
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Artigos, tutoriais e novidades sobre educação a distância, tecnologia e inovação.
              </p>
            </div>
          </div>
        </section>
        
        {/* Blog Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <article key={index} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className={`h-48 ${post.image} flex items-center justify-center`}>
                    <span className="text-4xl">📚</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{post.date}</span>
                      <span className="mx-2">•</span>
                      <span>{post.category}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <Button 
                      variant="outline" 
                      className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                      onClick={() => navigate('/contato')}
                    >
                      Ler artigo
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Button variant="outline" className="mr-2">
                Artigos anteriores
              </Button>
              <Button>
                Próximos artigos
              </Button>
            </div>
          </div>
        </section>
        
        {/* Newsletter */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inscreva-se na nossa newsletter</h2>
            <p className="text-gray-600 mb-8">
              Receba artigos, notícias e novidades diretamente no seu e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button onClick={() => {}}>
                Inscrever-se
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}