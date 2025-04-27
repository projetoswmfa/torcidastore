import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { getProductImageUrl } from "@/integrations/supabase/storage";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, InfoIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_IMAGE_BASE64 } from "@/utils/imageUtil";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category_id?: string;
  category?: { name: string };
  subcategory?: { name: string };
  image_url?: string;
  images?: {
    storage_path: string;
    is_primary: boolean;
    alt_text: string;
  }[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para personalização
  const [isCustomized, setIsCustomized] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  
  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(name),
            subcategory:subcategories(name),
            images:image_metadata(storage_path, is_primary, alt_text)
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro ao buscar produto:', error);
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="aspect-square bg-gray-100 rounded-lg">
              <Skeleton className="w-full h-full" />
            </div>
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-8 w-1/4 mb-6" />
              <Skeleton className="h-20 w-full mb-8" />
              <Skeleton className="h-8 w-1/2 mb-2" />
              <div className="flex gap-2 mb-8">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-10" />
                ))}
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <p className="mt-4">
            O produto que você está procurando não foi encontrado ou pode ter sido removido.
          </p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Voltar para a Home
          </Button>
        </div>
      </Layout>
    );
  }

  // Calcular preço com personalização
  const basePrice = product.price;
  const customizationPrice = 20;
  const totalPrice = isCustomized ? basePrice + customizationPrice : basePrice;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(totalPrice);

  // Preparar imagens: usar images[] de image_metadata se disponível, senão usar image_url
  const productImages: string[] = [];
  
  if (product.images && product.images.length > 0) {
    // Usar imagens do storage
    productImages.push(
      ...product.images.map(img => getProductImageUrl(img.storage_path))
    );
  } else if (product.image_url) {
    // Usar image_url se não houver imagens no storage
    productImages.push(product.image_url);
  } else {
    // Fallback para imagem padrão
    productImages.push(PLACEHOLDER_IMAGE_BASE64);
  }

  // Garantir que sempre temos 3 imagens, mesmo que com placeholders
  while (productImages.length < 3) {
    productImages.push(PLACEHOLDER_IMAGE_BASE64);
  }

  const handleAddToCart = () => {
    if (!selectedSize) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: totalPrice,
      size: selectedSize,
      image: productImages[0],
      quantity,
      customization: isCustomized ? {
        name: customName,
        number: customNumber
      } : undefined
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  // Tamanhos disponíveis (temporários até ter no banco)
  const sizes = ["P", "M", "G", "GG"];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            Home
          </Link>{" "}
          /{" "}
          {product.category && (
            <>
              <Link to={`/categoria/${product.category_id}`} className="text-sm text-gray-500 hover:text-gray-700">
                {product.category.name}
              </Link>{" "}
              /{" "}
            </>
          )}
          <span className="text-sm text-gray-700">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Product Images */}
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={productImages[currentImageIndex]} 
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>
            
            {productImages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-16 h-16 rounded border overflow-hidden flex-shrink-0",
                      currentImageIndex === index ? "border-sport-blue" : "border-gray-200"
                    )}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} - Imagem ${index + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {product.name}
            </h1>
            
            <div className="text-2xl font-bold text-sport-dark mb-4">
              {formattedPrice}
              {isCustomized && (
                <span className="text-sm text-gray-500 ml-2">(inclui personalização)</span>
              )}
            </div>

            <p className="text-gray-600 mb-8">
              {product.description || "Sem descrição disponível"}
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tamanho</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={cn(
                      "px-4 py-2 border rounded-md font-medium transition-colors",
                      selectedSize === size
                        ? "bg-sport-blue text-white border-sport-blue"
                        : "bg-white text-gray-800 border-gray-300 hover:border-sport-blue"
                    )}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-sm text-sport-red mt-2">
                  Selecione um tamanho
                </p>
              )}
            </div>

            {/* Personalização */}
            <div className="mb-6 border-2 border-sport-blue rounded-lg p-5 bg-blue-800 shadow-md customization-box">
              <div className="flex items-center space-x-3 mb-4">
                <Checkbox 
                  id="customization" 
                  checked={isCustomized}
                  onCheckedChange={(checked) => setIsCustomized(checked === true)}
                  className="h-5 w-5 text-yellow-400 border-white bg-blue-700 focus:ring-yellow-400"
                />
                <Label htmlFor="customization" className="font-semibold text-base flex items-center gap-2 cursor-pointer text-white">
                  <span className="bg-yellow-400 text-blue-900 px-2 py-0.5 rounded-md text-sm font-bold">NOVO</span>
                  Personalizar camisa (+R$ 20,00)
                </Label>
              </div>
              
              {isCustomized && (
                <div className="space-y-4 pt-3 border-t border-blue-600 mt-1">
                  <div className="space-y-2">
                    <Label htmlFor="customName" className="font-medium text-white">Nome na camisa</Label>
                    <Input 
                      id="customName"
                      placeholder="Ex: RONALDO"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                      className="uppercase border-blue-600 bg-blue-700 text-white placeholder:text-blue-300 focus:border-yellow-400 focus:ring-blue-600"
                      maxLength={15}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customNumber" className="font-medium text-white">Número</Label>
                    <Input 
                      id="customNumber"
                      placeholder="Ex: 9"
                      value={customNumber}
                      onChange={(e) => {
                        // Aceitar apenas números
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setCustomNumber(numericValue);
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      className="border-blue-600 bg-blue-700 text-white placeholder:text-blue-300 focus:border-yellow-400 focus:ring-blue-600"
                    />
                  </div>
                  
                  <div className="bg-blue-900 p-3 rounded-md flex items-start mt-2 border border-blue-600">
                    <InfoIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white">
                      Personalize sua camisa com nome e número. A personalização será aplicada nas costas da camisa conforme padrão oficial.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quantidade</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-md">
                  <button
                    className="px-3 py-1 text-lg border-r"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="px-4 py-1">{quantity}</span>
                  <button
                    className="px-3 py-1 text-lg border-l"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-sport-blue hover:bg-blue-600 flex items-center justify-center gap-2 cart-button"
              onClick={handleAddToCart}
              disabled={!selectedSize || (isCustomized && (!customName || !customNumber))}
            >
              <ShoppingCart className="h-5 w-5 text-white" />
              <span className="text-white">Adicionar ao carrinho</span>
            </Button>
            
            {isCustomized && (!customName || !customNumber) && (
              <p className="text-sm text-sport-red mt-2 text-center">
                Complete os dados da personalização
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
