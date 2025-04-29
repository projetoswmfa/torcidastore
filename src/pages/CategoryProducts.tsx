import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { PLACEHOLDER_IMAGE_BASE64 } from "@/utils/imageUtil";
import { useSiteImages, IMAGE_TYPES } from "@/hooks/useSiteImages";

// Função auxiliar para verificar correspondência de categorias
const matchCategory = (category: any, names: string[]): boolean => {
  if (!category) return false;
  
  // Verificar o nome da categoria
  if (category.name) {
    // Verificar correspondências exatas
    if (names.includes(category.name)) return true;
    
    // Verificar correspondências case-insensitive
    const lowerName = category.name.toLowerCase();
    return names.some(name => 
      name.toLowerCase() === lowerName || 
      lowerName.includes(name.toLowerCase())
    );
  }
  return false;
};

export default function CategoryProducts() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { images: categoryImages, loading: imagesLoading } = useSiteImages({ 
    type: IMAGE_TYPES.CATEGORY, 
    activeOnly: true 
  });

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [categoryData, setCategoryData] = useState<{id: string, name: string} | null>(null);
  const [categoryImage, setCategoryImage] = useState<string | null>(null);
  
  useEffect(() => {
    // Adicionar logs para debug
    console.log('CategoryId recebido:', categoryId);
    console.log('Categorias disponíveis:', categories);
    console.log('Todos os produtos disponíveis:', products);
    
    // Verificar estrutura do primeiro produto (se existir)
    if (products.length > 0) {
      console.log('Estrutura do primeiro produto:', {
        id: products[0].id,
        name: products[0].name,
        category_id: products[0].category_id,
        categoryName: products[0].category?.name,
        categoryObject: products[0].category
      });
    }
    
    // Filtrar produtos por categoria
    if (!productsLoading && !categoriesLoading && categoryId) {
      let foundCategory = false;
      console.log('Processando categoria:', categoryId);
      
      // Primeiro, tentar encontrar a categoria pelo ID exato (UUID ou numérico)
      const categoryById = categories.find(cat => String(cat.id) === categoryId);
      if (categoryById) {
        console.log('Categoria encontrada pelo ID:', categoryById);
        setCategoryName(categoryById.name);
        setCategoryData({id: categoryById.id, name: categoryById.name});
        foundCategory = true;
        
        const filtered = products.filter(product => 
          product.category_id === categoryById.id
        );
        console.log('Produtos filtrados por ID:', filtered);
        setFilteredProducts(filtered);
        return;
      }
      
      // Se não encontrou pelo ID, tentar pelo slug
      const categoryBySlug = categories.find(
        cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categoryId
      );
      
      if (categoryBySlug) {
        console.log('Categoria encontrada pelo slug:', categoryBySlug);
        setCategoryName(categoryBySlug.name);
        setCategoryData({id: categoryBySlug.id, name: categoryBySlug.name});
        foundCategory = true;
        
        const filtered = products.filter(product => 
          product.category_id === categoryBySlug.id
        );
        console.log('Produtos filtrados por slug:', filtered);
        setFilteredProducts(filtered);
        return;
      }
      
      // Casos especiais para categorias estáticas
      if (!foundCategory) {
        let filtered: Product[] = [];
        let categoryInfo = { id: '', name: '' };
        
        switch(categoryId) {
          case 'brasileiros':
            setCategoryName('TIMES BRASILEIROS');
            categoryInfo = { id: '1', name: 'TIMES BRASILEIROS' };
            filtered = products.filter(product => 
              matchCategory(product.category, ['Times Brasileiros', 'TIMES BRASILEIROS', 'Brasileiros']) ||
              product.category_id === '1' // ID da categoria Times Brasileiros conforme ProductForm
            );
            console.log('Produtos filtrados para TIMES BRASILEIROS:', filtered);
            break;
          case 'internacionais':
            setCategoryName('INTERNACIONAIS');
            categoryInfo = { id: '2', name: 'INTERNACIONAIS' };
            filtered = products.filter(product => 
              matchCategory(product.category, ['Internacionais', 'INTERNACIONAIS', 'Times Europeus', 'TIMES EUROPEUS']) ||
              product.category_id === '2' // ID da categoria Internacionais conforme ProductForm
            );
            console.log('Produtos filtrados para INTERNACIONAIS:', filtered);
            break;
          case 'selecoes':
            setCategoryName('SELEÇÕES');
            categoryInfo = { id: '3', name: 'SELEÇÕES' };
            filtered = products.filter(product => 
              matchCategory(product.category, ['Seleções', 'SELEÇÕES', 'Selecoes', 'SELECOES']) ||
              product.category_id === '3' // ID da categoria Seleções conforme ProductForm
            );
            console.log('Produtos filtrados para SELEÇÕES:', filtered);
            break;
          case 'europeus': // Manter compatibilidade com links antigos
            setCategoryName('INTERNACIONAIS');
            categoryInfo = { id: '2', name: 'INTERNACIONAIS' };
            filtered = products.filter(product => 
              matchCategory(product.category, ['Internacionais', 'INTERNACIONAIS', 'Times Europeus', 'TIMES EUROPEUS']) ||
              product.category_id === '2' // ID da categoria Internacionais conforme ProductForm
            );
            console.log('Produtos filtrados para INTERNACIONAIS (via europeus):', filtered);
            break;
          case 'retro':
            setCategoryName('RETRÔ');
            categoryInfo = { id: '4', name: 'RETRÔ' };
            filtered = products.filter(product => 
              matchCategory(product.category, ['Retrô', 'RETRÔ', 'Retro', 'RETRO']) ||
              product.category_id === '4' // ID da categoria Retrô conforme ProductForm
            );
            console.log('Produtos filtrados para RETRÔ:', filtered);
            break;
          case 'conjuntos':
            setCategoryName('CONJUNTOS');
            categoryInfo = { id: '5', name: 'CONJUNTOS' };
            filtered = products.filter(product => 
              matchCategory(product.category, ['Conjuntos', 'CONJUNTOS']) ||
              product.category_id === '5' // ID da categoria Conjuntos conforme ProductForm
            );
            console.log('Produtos filtrados para CONJUNTOS:', filtered);
            break;
          case 'inverno':
            setCategoryName('INVERNO');
            categoryInfo = { id: '6', name: 'INVERNO' };
            filtered = products.filter(product => 
              matchCategory(product.category, ['Inverno', 'INVERNO']) ||
              product.category_id === '6' // ID da categoria Inverno conforme ProductForm
            );
            console.log('Produtos filtrados para INVERNO:', filtered);
            break;
          case 'lancamentos':
            setCategoryName('LANÇAMENTOS');
            categoryInfo = { id: '0', name: 'LANÇAMENTOS' };
            filtered = [...products]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10);
            console.log('Produtos filtrados para LANÇAMENTOS:', filtered);
            break;
          case 'promocoes':
            setCategoryName('PROMOÇÕES');
            categoryInfo = { id: '0', name: 'PROMOÇÕES' };
            // Para promoções, podemos considerar todos os produtos por enquanto
            filtered = products;
            console.log('Produtos filtrados para PROMOÇÕES:', filtered);
            break;
          default:
            // Se chegou aqui, não encontramos uma categoria válida
            console.log('Categoria não encontrada:', categoryId);
            filtered = [];
        }
        
        console.log('Produtos filtrados por caso especial:', filtered);
        setCategoryData({id: categoryInfo.id, name: categoryInfo.name});
        setFilteredProducts(filtered);
      }
    }
  }, [categoryId, products, productsLoading, categories, categoriesLoading]);

  // Procurar a imagem da categoria sempre que categoryData mudar
  useEffect(() => {
    if (!imagesLoading && categoryData?.id && categoryImages.length > 0) {
      // Encontrar a imagem correspondente à categoria
      const image = categoryImages.find(img => img.reference_id === categoryData.id);
      setCategoryImage(image?.image_url || null);
    }
  }, [categoryData, categoryImages, imagesLoading]);
  
  // Função para debug - mostra informações detalhadas no console
  const debugCategories = () => {
    console.log('=== DEBUG CATEGORIAS E PRODUTOS ===');
    console.log('Categorias disponíveis:', categories);
    
    // Analisar relação entre produtos e categorias
    const categoryMap = new Map();
    
    // Agrupar produtos por category_id
    products.forEach(product => {
      const catId = product.category_id;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, []);
      }
      categoryMap.get(catId).push(product);
    });
    
    // Mostrar informações por categoria
    console.log('Categorias e seus produtos:');
    categories.forEach(category => {
      const productsInCategory = categoryMap.get(category.id) || [];
      console.log(`Categoria ID ${category.id}, Nome: ${category.name}, Produtos: ${productsInCategory.length}`);
      if (productsInCategory.length > 0) {
        console.log('Exemplo de produto nesta categoria:', productsInCategory[0].name);
      }
    });
    
    // Mostrar produtos sem categoria correspondente
    console.log('Produtos com categorias não mapeadas:');
    products.forEach(product => {
      const categoryFound = categories.some(cat => cat.id === product.category_id);
      if (!categoryFound) {
        console.log(`Produto: ${product.name}, Category ID: ${product.category_id}`);
      }
    });
    
    console.log('=== FIM DEBUG ===');
  };

  // Função para gerar produtos de exemplo para categorias vazias - apenas para desenvolvimento
  const getExampleProducts = (categoryId: string): Product[] => {
    // Se já temos produtos, não precisamos gerar exemplos
    if (filteredProducts.length > 0) return filteredProducts;
    
    console.log('Gerando produtos de exemplo para a categoria:', categoryId);
    
    const getCategoryInfo = () => {
      switch(categoryId) {
        case 'selecoes': return { name: 'SELEÇÕES', id: '3' };
        case 'retro': return { name: 'RETRÔ', id: '4' };
        case 'conjuntos': return { name: 'CONJUNTOS', id: '5' };
        case 'inverno': return { name: 'INVERNO', id: '6' };
        case 'brasileiros': return { name: 'TIMES BRASILEIROS', id: '1' };
        case 'internacionais': return { name: 'INTERNACIONAIS', id: '2' };
        case 'lancamentos': return { name: 'LANÇAMENTOS', id: '0' };
        case 'promocoes': return { name: 'PROMOÇÕES', id: '0' };
        default: return { name: categoryName, id: '0' };
      }
    };
    
    const categoryInfo = getCategoryInfo();
    
    // Criar 4 produtos de exemplo para a categoria
    return Array(4).fill(0).map((_, index) => ({
      id: `example-${categoryId}-${index}`,
      name: `Exemplo ${index + 1} - ${categoryName}`,
      price: 119.90,
      description: `Produto de exemplo para a categoria ${categoryName}`,
      category_id: categoryInfo.id,
      category: { name: categoryInfo.name },
      subcategory_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: PLACEHOLDER_IMAGE_BASE64,
      stock: 10,
      imported_from_file: false
    }));
  };

  // Em vez de usar filteredProducts diretamente, criar uma variável que pode incluir exemplos
  const displayedProducts = filteredProducts.length > 0 
    ? filteredProducts 
    : process.env.NODE_ENV === 'development' ? getExampleProducts(categoryId || '') : [];

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Banner da categoria se existir uma imagem */}
        {categoryImage && (
          <div className="relative h-64 w-full mb-6">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${categoryImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
            <div className="container mx-auto px-4 h-full flex items-center justify-center">
              <h1 className="text-4xl font-bold text-white text-center">
                {categoryName}
              </h1>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                Home
              </Link>{" "}
              /{" "}
              <span className="text-sm text-gray-700">{categoryName || categoryId}</span>
            </div>
            
            {/* Botão de debug - visível apenas em ambiente de desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={debugCategories}
                className="flex items-center gap-1 text-xs opacity-30 hover:opacity-100"
              >
                <Shield className="h-3 w-3" />
                <span>Debug</span>
              </Button>
            )}
          </div>
          
          {productsLoading || categoriesLoading ? (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Carregando produtos...</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array(8).fill(0).map((_, index) => (
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
              title={!categoryImage ? (categoryName || `Categoria: ${categoryId}`) : ""}
              products={displayedProducts}
              emptyMessage="Nenhum produto encontrado nesta categoria"
              className="mb-16"
            />
          )}
        </div>
      </div>
    </Layout>
  );
} 