// Serviço para gerenciar URLs de imagem sem depender do AWS S3
import { supabase } from '../supabase/client';

// Função para validar URL de imagem
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    // Verificar se a URL possui uma extensão de imagem comum
    const hasImageExtension = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
    
    if (!hasImageExtension) {
      return false;
    }
    
    // Tentar fazer um HEAD request para verificar se a imagem existe
    // e se é acessível
    const response = await fetch(url, { method: 'HEAD' });
    
    // Verificar se a resposta foi bem-sucedida e se o content-type é de imagem
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType ? contentType.startsWith('image/') : false;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao validar URL da imagem:', error);
    return false;
  }
}

interface ImageData {
  imageUrl: string;
  altText?: string;
  description?: string;
}

/**
 * Registra uma URL de imagem no sistema
 * @param imageUrl URL da imagem
 * @param metadata Metadados opcionais (título, descrição, etc)
 * @returns Objeto com a URL da imagem
 */
export async function registerImageUrl(
  imageUrl: string, 
  metadata: Record<string, any> = {}
): Promise<ImageData> {
  // Validar a URL
  const isValid = await isValidImageUrl(imageUrl);
  
  if (!isValid) {
    throw new Error("URL de imagem inválida ou inacessível");
  }
  
  // Dados a serem inseridos no Supabase
  const imageData = {
    image_url: imageUrl,
    image_path: '', // Campo mantido para compatibilidade, não usado
    alt_text: metadata.altText || '',
    description: metadata.description || '',
    additional_data: metadata,
    created_at: new Date().toISOString(),
  };
  
  // Registrar a imagem no banco de dados para fins de rastreamento (opcional)
  try {
    const { data, error } = await supabase
      .from('site_images')
      .insert(imageData)
      .select('id')
      .single();
      
    if (error) {
      console.error('Erro ao registrar imagem no banco de dados:', error);
      // Não falha a operação, apenas loga o erro
    }
  } catch (err) {
    console.error('Erro ao registrar imagem:', err);
    // Não falha a operação, apenas loga o erro
  }
  
  return {
    imageUrl,
    altText: metadata.altText,
    description: metadata.description
  };
}

/**
 * Armazena uma URL de imagem para um produto
 * @param productId ID do produto
 * @param imageUrl URL da imagem
 * @returns Status da operação
 */
export async function saveProductImageUrl(
  productId: string,
  imageUrl: string
): Promise<{ success: boolean }> {
  try {
    // Validar a URL
    const isValid = await isValidImageUrl(imageUrl);
    
    if (!isValid) {
      throw new Error("URL de imagem inválida ou inacessível");
    }
    
    // Atualizar o produto com a URL da imagem
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);
    
    if (error) {
      throw error;
    }
    
    // Registrar ação para fins de auditoria
    await supabase
      .from('system_logs')
      .insert({
        resource_type: 'product',
        resource_id: productId,
        action: 'update_image',
        details: { image_url: imageUrl }
      })
      .then(res => {
        if (res.error) {
          console.error('Erro ao registrar log:', res.error);
        }
      });
    
    return { success: true };
  } catch (err) {
    console.error('Erro ao salvar URL da imagem:', err);
    throw err;
  }
}

/**
 * Remove associação da imagem com um produto
 * @param productId ID do produto
 * @returns Status da operação
 */
export async function removeProductImage(
  productId: string
): Promise<{ success: boolean }> {
  try {
    // Atualizar o produto removendo a referência à imagem
    const { error } = await supabase
      .from('products')
      .update({ image_url: null })
      .eq('id', productId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (err) {
    console.error('Erro ao remover imagem do produto:', err);
    throw err;
  }
}

/**
 * Verificar se uma URL de imagem existe e é acessível
 * @param imageUrl URL da imagem a verificar
 * @returns Status da verificação
 */
export async function verifyImageUrl(
  imageUrl: string
): Promise<{ 
  valid: boolean; 
  message: string; 
  statusCode?: number;
  contentType?: string;
}> {
  try {
    // Verificar se a URL parece ser uma URL de imagem
    const hasImageExtension = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(imageUrl);
    
    if (!hasImageExtension) {
      return { 
        valid: false, 
        message: 'URL não possui uma extensão de imagem válida' 
      };
    }
    
    // Verificar se a URL é acessível
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const statusCode = response.status;
    const contentType = response.headers.get('content-type') || '';
    
    // Verificar se a resposta foi bem-sucedida
    if (response.ok) {
      // Verificar se o content-type é de imagem
      if (contentType.startsWith('image/')) {
        return { 
          valid: true, 
          message: 'Imagem válida e acessível',
          statusCode,
          contentType
        };
      } else {
        return { 
          valid: false, 
          message: `Recurso encontrado, mas não é uma imagem (${contentType})`,
          statusCode,
          contentType
        };
      }
    } else {
      return { 
        valid: false, 
        message: `Imagem inacessível (HTTP ${statusCode})`,
        statusCode,
        contentType
      };
    }
  } catch (error) {
    console.error('Erro ao verificar URL da imagem:', error);
    return { 
      valid: false, 
      message: `Erro ao acessar URL: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
} 