import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';

export interface SiteImage {
  id: string;
  type: string;
  reference_id?: string;
  image_path: string;
  image_url?: string;
  title?: string;
  description?: string;
  link?: string;
  active: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export const IMAGE_TYPES = {
  BANNER: 'banner',
  CATEGORY: 'category',
  LOGO: 'logo',
  FEATURED: 'featured',
} as const;

export type ImageType = typeof IMAGE_TYPES[keyof typeof IMAGE_TYPES];

export interface UseSiteImagesProps {
  type?: ImageType;
  activeOnly?: boolean;
  referenceId?: string;
}

export interface UseSiteImagesReturn {
  images: SiteImage[];
  loading: boolean;
  error: Error | null;
  fetchImages: () => Promise<void>;
  createImage: (image: Partial<SiteImage>) => Promise<SiteImage | null>;
  updateImage: (id: string, image: Partial<SiteImage>) => Promise<SiteImage | null>;
  deleteImage: (id: string) => Promise<boolean>;
  reorderImages: (imageIds: string[]) => Promise<boolean>;
}

/**
 * Hook para gerenciar imagens do site como banners, imagens de categoria, etc.
 */
export function useSiteImages({ 
  type,
  activeOnly = true, 
  referenceId 
}: UseSiteImagesProps = {}): UseSiteImagesReturn {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('site_images')
        .select('*');
      
      // Filtrar por tipo se especificado
      if (type) {
        query = query.eq('type', type);
      }
      
      // Filtrar por referência se especificada
      if (referenceId) {
        query = query.eq('reference_id', referenceId);
      }
      
      // Filtrar apenas imagens ativas se necessário
      if (activeOnly) {
        query = query.eq('active', true);
      }
      
      // Ordenar por posição
      query = query.order('order_position', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setImages(data || []);
    } catch (err) {
      console.error('Erro ao buscar imagens do site:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar imagens'));
      toast.error('Erro ao carregar imagens do site');
    } finally {
      setLoading(false);
    }
  }, [type, activeOnly, referenceId]);

  const createImage = async (image: Partial<SiteImage>): Promise<SiteImage | null> => {
    try {
      if (!image.type) {
        throw new Error('Tipo de imagem é obrigatório');
      }
      
      if (!image.image_path && !image.image_url) {
        throw new Error('Caminho ou URL da imagem é obrigatório');
      }
      
      setLoading(true);
      
      // Encontrar a maior posição atual para este tipo de imagem
      const { data: positionData } = await supabase
        .from('site_images')
        .select('order_position')
        .eq('type', image.type)
        .order('order_position', { ascending: false })
        .limit(1);
      
      // Definir a próxima posição
      const nextPosition = positionData && positionData.length > 0 
        ? (positionData[0].order_position || 0) + 1 
        : 0;
      
      // Inserir a nova imagem
      const { data, error } = await supabase
        .from('site_images')
        .insert({
          ...image,
          order_position: nextPosition,
          active: image.active !== undefined ? image.active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Imagem adicionada com sucesso');
      
      // Atualizar a lista de imagens
      await fetchImages();
      
      return data;
    } catch (err) {
      console.error('Erro ao criar imagem do site:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao criar imagem'));
      toast.error(`Erro ao adicionar imagem: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateImage = async (id: string, image: Partial<SiteImage>): Promise<SiteImage | null> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('site_images')
        .update({
          ...image,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Imagem atualizada com sucesso');
      
      // Atualizar a lista de imagens
      await fetchImages();
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar imagem do site:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao atualizar imagem'));
      toast.error(`Erro ao atualizar imagem: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('site_images')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Imagem removida com sucesso');
      
      // Atualizar a lista de imagens
      await fetchImages();
      
      return true;
    } catch (err) {
      console.error('Erro ao excluir imagem do site:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao excluir imagem'));
      toast.error(`Erro ao remover imagem: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reorderImages = async (imageIds: string[]): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Atualizar a posição de cada imagem
      for (let i = 0; i < imageIds.length; i++) {
        const { error } = await supabase
          .from('site_images')
          .update({ 
            order_position: i,
            updated_at: new Date().toISOString()
          })
          .eq('id', imageIds[i]);
        
        if (error) {
          throw error;
        }
      }
      
      toast.success('Ordem das imagens atualizada');
      
      // Atualizar a lista de imagens
      await fetchImages();
      
      return true;
    } catch (err) {
      console.error('Erro ao reordenar imagens do site:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao reordenar imagens'));
      toast.error(`Erro ao reordenar imagens: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar imagens ao iniciar
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    fetchImages,
    createImage,
    updateImage,
    deleteImage,
    reorderImages
  };
} 