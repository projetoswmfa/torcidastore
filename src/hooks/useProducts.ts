import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Product = Tables<'products'> & {
  category?: {
    name: string;
  };
  subcategory?: {
    name: string;
  };
  images?: {
    storage_path: string;
    is_primary: boolean;
    alt_text: string | null;
  }[];
  image_url?: string;
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    try {
      console.log('Iniciando busca de produtos...');
      setLoading(true);
      setError(null);
      
      // Teste de conexão com Supabase
      try {
        const { data: testData, error: testError } = await supabase.from('products').select('count');
        if (testError) {
          console.error('Erro no teste de conexão:', testError);
          toast.error('Erro na conexão com o banco de dados');
          throw new Error(`Erro na conexão: ${testError.message}`);
        }
        console.log('Teste de conexão bem-sucedido:', testData);
      } catch (testErr) {
        console.error('Exceção no teste de conexão:', testErr);
      }
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro na consulta de produtos:', error);
        toast.error(`Erro ao buscar produtos: ${error.message}`);
        throw error;
      }

      console.log('Produtos recuperados:', data?.length || 0);
      console.log('Primeiro produto:', data?.[0] || 'Nenhum produto encontrado');
      
      // Buscar imagens para cada produto se necessário
      // Código para buscar imagens aqui se necessário
      
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar produtos'));
      toast.error('Falha ao carregar produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, fetchProducts };
} 