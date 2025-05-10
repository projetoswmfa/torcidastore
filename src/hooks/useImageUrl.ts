import { useState } from 'react';
import { 
  registerImageUrl, 
  saveProductImageUrl, 
  removeProductImage, 
  verifyImageUrl 
} from '../integrations/images/imageService';

interface ImageHookReturn {
  loading: boolean;
  error: Error | null;
  saveImageUrl: (
    imageUrl: string,
    productId?: string,
    metadata?: Record<string, any>
  ) => Promise<{ imageUrl: string }>;
  updateProductImage: (
    productId: string,
    imageUrl: string
  ) => Promise<void>;
  removeImage: (
    productId: string
  ) => Promise<void>;
  validateImageUrl: (
    imageUrl: string
  ) => Promise<{ valid: boolean; message: string }>;
}

/**
 * Hook para gerenciar URLs de imagem diretamente
 */
export function useImageUrl(): ImageHookReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Valida e registra uma URL de imagem
   */
  const saveImageUrl = async (
    imageUrl: string,
    productId?: string,
    metadata: Record<string, any> = {}
  ): Promise<{ imageUrl: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar e registrar a URL da imagem
      const result = await registerImageUrl(imageUrl, metadata);
      
      // Se um ID de produto foi fornecido, atualiza-o também
      if (productId) {
        await saveProductImageUrl(productId, imageUrl);
      }
      
      return { imageUrl: result.imageUrl };
    } catch (err) {
      const errorToSet = err instanceof Error ? err : new Error('Erro ao salvar URL da imagem');
      setError(errorToSet);
      throw errorToSet;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza a imagem de um produto com uma URL
   */
  const updateProductImage = async (
    productId: string,
    imageUrl: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await saveProductImageUrl(productId, imageUrl);
    } catch (err) {
      const errorToSet = err instanceof Error ? err : new Error('Erro ao atualizar imagem do produto');
      setError(errorToSet);
      throw errorToSet;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a imagem de um produto
   */
  const removeImage = async (
    productId: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await removeProductImage(productId);
    } catch (err) {
      const errorToSet = err instanceof Error ? err : new Error('Erro ao remover imagem do produto');
      setError(errorToSet);
      throw errorToSet;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valida se uma URL é uma imagem válida e acessível
   */
  const validateImageUrl = async (
    imageUrl: string
  ): Promise<{ valid: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await verifyImageUrl(imageUrl);
      return { 
        valid: result.valid, 
        message: result.message 
      };
    } catch (err) {
      const errorToSet = err instanceof Error ? err : new Error('Erro ao validar URL da imagem');
      setError(errorToSet);
      return { 
        valid: false, 
        message: errorToSet.message 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    saveImageUrl,
    updateProductImage,
    removeImage,
    validateImageUrl,
  };
} 