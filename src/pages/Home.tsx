import { BannerCarousel } from "@/components/home/BannerCarousel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

// Categorias temporárias para exibição enquanto carrega ou se não houver categorias
const defaultCategories = [
  { 
    name: "Times Brasileiros", 
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", 
    path: "/categoria/brasileiros" 
  },
  { 
    name: "Internacionais", 
    image: "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", 
    path: "/categoria/internacionais" 
  },
  { 
    name: "Seleções", 
    image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", 
    path: "/categoria/selecoes" 
  },
  { 
    name: "Retrô", 
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", 
    path: "/categoria/retro" 
  },
  { 
    name: "Conjuntos", 
    image: "https://images.unsplash.com/photo-1594125674956-61a9b49c8ecc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", 
    path: "/categoria/conjuntos" 
  },
  { 
    name: "Inverno", 
    image: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", 
    path: "/categoria/inverno" 
  }
];

// Função para criar um slug a partir do nome da categoria
const createSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

export default function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  // Filtrar produtos mais recentes (por data de criação)
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);
  
  // Mostrar todos os produtos como destaques por enquanto
  const featuredProducts = products.slice(0, 4);

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Banner Carousel */}
        <BannerCarousel />
        
        {/* Featured Products */}
        <div className="container mx-auto px-4 py-12">
          {productsLoading ? (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Destaques</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array(4).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <div className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ProductGrid 
              title="Destaques" 
              products={featuredProducts} 
              className="mb-16" 
            />
          )}
          
          {/* Categories */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Navegue por Categorias</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(categoriesLoading ? defaultCategories : categories.map(cat => ({
                name: cat.name,
                image: "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
                path: `/categoria/${createSlug(cat.name)}`
              }))).map((category) => (
                <Link 
                  to={category.path} 
                  key={category.name}
                  className="group relative h-64 rounded-lg overflow-hidden shadow"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url(${category.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white text-center">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          
          {/* New Arrivals */}
          {productsLoading ? (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Lançamentos</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array(4).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <div className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ProductGrid 
              title="Lançamentos" 
              products={newArrivals} 
              className="mb-16" 
            />
          )}
          
          {/* Newsletter */}
          <section className="mb-16 bg-sport-dark text-white rounded-lg p-8 md:p-12">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Fique por dentro das novidades</h2>
              <p className="text-lg mb-6 text-gray-300">
                Inscreva-se para receber atualizações sobre novos produtos e ofertas especiais.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none sm:rounded-r-none rounded-r-lg"
                />
                <Button className="bg-sport-blue hover:bg-blue-600 sm:rounded-l-none rounded-l-lg">
                  Inscrever-se
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
