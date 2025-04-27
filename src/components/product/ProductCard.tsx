import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/hooks/useProducts";
import { getProductImageUrl } from "@/integrations/supabase/storage";
import { PLACEHOLDER_IMAGE_BASE64, ERROR_PLACEHOLDER_BASE64 } from "@/utils/imageUtil";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { id, name, price, image_url } = product;
  
  // Encontrar imagem primária ou a primeira imagem disponível
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  
  // Estratégia para obter uma imagem válida:
  // 1. Usar imagem do storage se disponível
  // 2. Se não, usar image_url se disponível
  // 3. Se nenhuma disponível, usar imagem de placeholder
  let imageUrl = PLACEHOLDER_IMAGE_BASE64;
  
  if (primaryImage) {
    // Imagem do storage tem prioridade
    imageUrl = getProductImageUrl(primaryImage.storage_path);
  } else if (image_url) {
    // Se não tem imagem no storage mas tem image_url, usar image_url
    imageUrl = image_url;
  }
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
  
  return (
    <div className={cn("product-card bg-card text-card-foreground rounded-lg overflow-hidden shadow-md border border-border", className)}>
      <Link to={`/produto/${id}`} className="block relative">
        <div className="aspect-[3/4] relative overflow-hidden">
          <img 
            src={imageUrl} 
            alt={primaryImage?.alt_text || name}
            className="absolute inset-0 w-full h-full object-cover object-center transition duration-300 hover:scale-105"
            onError={(e) => {
              // Fallback para imagem de placeholder se a imagem não carregar
              (e.target as HTMLImageElement).src = ERROR_PLACEHOLDER_BASE64;
            }}
          />
          
          {/* Marcador de categoria se disponível */}
          {product.category && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
              {product.category.name}
            </span>
          )}
        </div>
      </Link>
      
      <div className="p-5">
        <h3 className="font-medium text-foreground line-clamp-2 min-h-[48px]">
          <Link to={`/produto/${id}`}>
            {name}
          </Link>
        </h3>
        
        <div className="mt-3 flex items-end gap-2">
          <span className="text-lg font-bold text-primary">
            {formattedPrice}
          </span>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <Link to={`/produto/${id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Detalhes
            </Button>
          </Link>
          <Button size="icon" className="bg-sport-blue hover:bg-blue-600 cart-button">
            <ShoppingCart className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
