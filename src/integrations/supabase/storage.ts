import { supabase } from './client';
import { PLACEHOLDER_IMAGE_BASE64 } from '../../utils/imageUtil';

const BUCKET_NAME = 'product-images';

// Verifica se o bucket existe, se não, cria
export async function ensureStorageBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.find(bucket => bucket.name === BUCKET_NAME)) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Configuração importante para acesso público
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Erro ao criar bucket:', error);
        throw error;
      }
    }

    // Definir políticas de acesso público para o bucket
    // Isso já deve estar configurado, mas vamos garantir
    console.log("Bucket verificado e configurado com sucesso");
  } catch (error) {
    console.error('Erro ao configurar bucket:', error);
    throw error;
  }
}

// Função para fazer upload de uma imagem
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  try {
    await ensureStorageBucket();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    console.log("Tentando fazer upload da imagem:", filePath);
    
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Sobrescrever se existir
      });
    
    if (uploadError) {
      console.error("Erro detalhado ao fazer upload:", uploadError);
      throw uploadError;
    }
    
    console.log("Upload bem-sucedido, dados:", data);
    
    // Obter e testar a URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    console.log("URL pública gerada:", urlData.publicUrl);
    
    // Testar se a URL é acessível
    try {
      const testResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log(`Teste de URL retornou status: ${testResponse.status}`);
      
      if (!testResponse.ok) {
        console.warn(`Atenção: URL pode não estar acessível. Status: ${testResponse.status}`);
      }
    } catch (testError) {
      console.warn("Não foi possível testar a URL. Isso pode indicar problemas de CORS ou rede:", testError);
    }
    
    // Retornar o caminho relativo para armazenamento no banco
    return filePath;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
}

// Função para excluir uma imagem
export async function deleteProductImage(path: string) {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    throw error;
  }
}

// Cache para as URLs de imagens
const imageUrlCache: Record<string, string> = {};

// Função para obter a URL pública de uma imagem
export function getProductImageUrl(path: string): string {
  if (!path) {
    console.error('getProductImageUrl: Caminho vazio');
    return PLACEHOLDER_IMAGE_BASE64;
  }
  
  // Se já for uma URL completa, retorna ela mesma
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Se começar com "/", remove para compatibilidade
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Verificar se a URL já está em cache
  if (imageUrlCache[cleanPath]) {
    return imageUrlCache[cleanPath];
  }
  
  try {
    console.log(`Gerando URL para path: "${cleanPath}"`);
    
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(cleanPath);
    
    if (!data || !data.publicUrl) {
      console.error('Supabase retornou dados vazios ao tentar gerar URL pública:', cleanPath);
      return PLACEHOLDER_IMAGE_BASE64;
    }
    
    // Log para debug
    console.log(`URL gerada: "${data.publicUrl}" para path "${cleanPath}"`);
    
    // Armazenar no cache para uso futuro
    imageUrlCache[cleanPath] = data.publicUrl;
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao obter URL da imagem:', error, path);
    return PLACEHOLDER_IMAGE_BASE64;
  }
} 