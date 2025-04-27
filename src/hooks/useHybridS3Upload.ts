import { useState } from 'react';
import { uploadFile, deleteFile } from '../integrations/s3/fileStorageService';
import { supabase } from '../integrations/supabase/client';
import type { TablesUpdate } from '../integrations/supabase/types';

interface UploadOptions {
  folder?: string;
  productId?: string;
  userId?: string;
  isPublic?: boolean;
  tags?: string[];
  description?: string;
}

interface UploadHookReturn {
  uploading: boolean;
  error: Error | null;
  uploadImage: (
    file: File, 
    options?: UploadOptions
  ) => Promise<{ imageUrl: string; key: string }>;
  deleteImage: (
    key: string
  ) => Promise<boolean>;
  updateProductImageUrl: (
    productId: string, 
    imageUrl: string
  ) => Promise<void>;
}

/**
 * Hook personalizado para upload de imagens para AWS S3 com metadados no Supabase
 * e integração com a tabela de produtos
 */
export function useHybridS3Upload(): UploadHookReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Faz upload de uma imagem para o S3 com metadados enriquecidos
   */
  const uploadImage = async (
    file: File, 
    options?: UploadOptions
  ): Promise<{ imageUrl: string; key: string }> => {
    setUploading(true);
    setError(null);
    
    try {
      // Extrair opções com valores padrão
      const folder = options?.folder || 'products';
      const productId = options?.productId;
      const userId = options?.userId;
      
      // Metadados adicionais para enriquecer o arquivo
      const additionalMetadata: Record<string, any> = {
        description: options?.description || file.name,
        tags: options?.tags || [],
        isPublic: options?.isPublic !== false, // público por padrão
        uploadedAt: new Date().toISOString()
      };
      
      // Adicionar productId se fornecido
      if (productId) {
        additionalMetadata.productId = productId;
      }
      
      // Adicionar userId se fornecido
      if (userId) {
        additionalMetadata.userId = userId;
      }
      
      // Enviar para a API
      const result = await uploadFile(file, folder, additionalMetadata);
      
      return { 
        imageUrl: result.url, 
        key: result.key 
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido no upload'));
      throw err;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Exclui uma imagem do S3 e seus metadados
   */
  const deleteImage = async (key: string): Promise<boolean> => {
    try {
      const result = await deleteFile(key);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao excluir imagem'));
      throw err;
    }
  };

  /**
   * Atualiza a URL da imagem do produto no Supabase
   */
  const updateProductImageUrl = async (
    productId: string, 
    imageUrl: string
  ): Promise<void> => {
    try {
      // Definir o tipo de dados para a atualização
      const updateData: { image_url: string } = { image_url: imageUrl };
      
      const { error } = await supabase
        .from('products')
        .update(updateData as unknown as TablesUpdate<'products'>)
        .eq('id', productId);
      
      if (error) {
        throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar URL da imagem'));
      throw err;
    }
  };

  return {
    uploading,
    error,
    uploadImage,
    deleteImage,
    updateProductImageUrl,
  };
} 