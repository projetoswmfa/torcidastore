import { useState } from 'react';
import { uploadFileToS3 } from '../integrations/aws/s3client';
import { supabase } from '../integrations/supabase/client';
import type { TablesUpdate } from '../integrations/supabase/types';

interface UploadOptions {
  bucket?: string;
  folder?: string;
}

interface UploadHookReturn {
  uploading: boolean;
  error: Error | null;
  uploadImage: (
    file: File, 
    productId: string, 
    options?: UploadOptions
  ) => Promise<{ imageUrl: string; key: string }>;
  updateProductImageUrl: (
    productId: string, 
    imageUrl: string
  ) => Promise<void>;
}

/**
 * Hook personalizado para upload de imagens para AWS S3 e
 * integração com o Supabase para salvar a URL da imagem
 */
export function useS3Upload(): UploadHookReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Faz upload de uma imagem para o AWS S3
   */
  const uploadImage = async (
    file: File, 
    productId: string,
    options?: UploadOptions
  ): Promise<{ imageUrl: string; key: string }> => {
    setUploading(true);
    setError(null);
    
    try {
      // Validar parâmetros
      if (!file) {
        throw new Error("Arquivo não fornecido");
      }
      
      if (!productId) {
        throw new Error("ID do produto é obrigatório");
      }
      
      // Gerar nome do arquivo com base no ID do produto
      const fileExt = file.name.split('.').pop();
      const folder = options?.folder || 'products';
      const fileName = `${folder}/${productId}/${Date.now()}.${fileExt}`;
      
      console.log(`Iniciando upload de arquivo para S3: ${fileName}`);
      
      // Substitui o arquivo original com um novo nome
      const renamedFile = new File([file], fileName, {
        type: file.type,
      });
      
      // Envia para o S3
      try {
        const { key, url } = await uploadFileToS3(renamedFile);
        
        if (!key || !url) {
          console.error("Upload para S3 falhou: resposta incompleta", { key, url });
          throw new Error("Falha no upload para S3: resposta incompleta");
        }
        
        console.log("Upload para S3 concluído com sucesso:", { key, url });
        
        return { imageUrl: url, key };
      } catch (uploadErr) {
        console.error("Erro no upload para S3:", uploadErr);
        const errorMsg = uploadErr instanceof Error 
          ? uploadErr.message 
          : 'Falha na comunicação com o servidor de upload';
        throw new Error(`Erro ao fazer upload da imagem: ${errorMsg}`);
      }
    } catch (err) {
      console.error("Erro em uploadImage:", err);
      const errorToSet = err instanceof Error ? err : new Error('Erro desconhecido no upload');
      setError(errorToSet);
      throw errorToSet;
    } finally {
      setUploading(false);
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
      if (!productId) {
        throw new Error("ID do produto é obrigatório");
      }
      
      if (!imageUrl) {
        throw new Error("URL da imagem é obrigatória");
      }
      
      console.log(`Atualizando URL da imagem para o produto ${productId}:`, imageUrl);
      
      // Usar casting para TablesUpdate para atualizar o campo image_url
      const updateData = { 
        // Cast para resolver o problema de tipagem
        image_url: imageUrl 
      };
      
      const { error: supabaseError } = await supabase
        .from('products')
        .update(updateData as unknown as TablesUpdate<'products'>)
        .eq('id', productId);
      
      if (supabaseError) {
        console.error("Erro do Supabase ao atualizar URL da imagem:", supabaseError);
        throw supabaseError;
      }
      
      console.log("URL da imagem atualizada com sucesso");
    } catch (err) {
      console.error("Erro em updateProductImageUrl:", err);
      const errorToSet = err instanceof Error ? err : new Error('Erro ao atualizar URL da imagem');
      setError(errorToSet);
      throw errorToSet;
    }
  };

  return {
    uploading,
    error,
    uploadImage,
    updateProductImageUrl,
  };
} 