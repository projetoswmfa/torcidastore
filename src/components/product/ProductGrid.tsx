import { ProductCard } from "./ProductCard";
import { Product } from "@/hooks/useProducts";

interface ProductGridProps {
  title?: string;
  products: Product[];
  className?: string;
  emptyMessage?: string;
}

export function ProductGrid({ title, products, className, emptyMessage = "Nenhum produto encontrado" }: ProductGridProps) {
  const hasProducts = products.length > 0;

  return (
    <section className={className}>
      {title && (
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
      )}
      
      {hasProducts ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}
