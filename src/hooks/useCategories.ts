import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Category = Tables<'categories'> & {
  subcategories?: Tables<'subcategories'>[];
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
    try {
      console.log('Iniciando busca de categorias...');
      setLoading(true);
      setError(null);
      
      // Teste de conexão com Supabase
      try {
        const { data: testData, error: testError } = await supabase.from('categories').select('count');
        if (testError) {
          console.error('Erro no teste de conexão (categorias):', testError);
          toast.error('Erro na conexão com o banco de dados');
          throw new Error(`Erro na conexão: ${testError.message}`);
        }
        console.log('Teste de conexão para categorias bem-sucedido:', testData);
      } catch (testErr) {
        console.error('Exceção no teste de conexão (categorias):', testErr);
      }
      
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories:subcategories(*)
        `);

      if (error) {
        console.error('Erro na consulta de categorias:', error);
        toast.error(`Erro ao buscar categorias: ${error.message}`);
        throw error;
      }

      console.log('Categorias recuperadas:', data?.length || 0);
      console.log('Primeira categoria:', data?.[0] || 'Nenhuma categoria encontrada');
      
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar categorias'));
      console.error('Erro ao buscar categorias:', err);
      toast.error('Falha ao carregar categorias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, fetchCategories };
} 