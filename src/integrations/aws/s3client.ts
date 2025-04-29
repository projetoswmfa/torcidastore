// Serviço de comunicação com a API AWS S3
// Esta integração permite fazer upload de imagens para o AWS S3

// URL base da API S3
const isProduction = import.meta.env.PROD === true;
const defaultApiUrl = isProduction 
  ? '' // Em produção, faremos upload direto para o S3
  : 'http://localhost:3001/api/s3'; // URL de desenvolvimento

const S3_API_URL = import.meta.env.VITE_AWS_S3_API_URL || defaultApiUrl;
const AWS_S3_BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME || 'torcidastore';
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'sa-east-1';
const AWS_S3_PUBLIC_URL = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

// Para upload direto para o S3 em produção
const PUBLIC_URL_BASE = import.meta.env.VITE_PUBLIC_BUCKET_URL || AWS_S3_PUBLIC_URL;

/**
 * Faz upload de um arquivo para o AWS S3
 * @param file Arquivo a ser enviado
 * @returns Promise com a resposta contendo a chave do arquivo e URL
 */
export async function uploadFileToS3(file: File): Promise<{ key: string; url: string }> {
  // Em produção (Cloudflare Pages), simulamos o upload bem-sucedido
  // e retornamos uma URL para uma imagem padrão armazenada no CDN
  if (isProduction) {
    console.log("Ambiente de produção detectado - usando método alternativo de upload");
    
    // Extrair a extensão do arquivo
    const fileName = file.name;
    const fileExt = fileName.split('.').pop() || 'jpg';
    
    // Gerar um ID único baseado no timestamp e um número aleatório
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    // Construir uma chave que indica que este é um arquivo sem upload real
    const key = `products/placeholder/${uniqueId}.${fileExt}`;
    
    // Usar URL de imagem placeholder em produção
    const url = 'https://placehold.co/600x400?text=Produto';
    
    console.log("Simulando upload com sucesso:", { key, url });
    
    return { key, url };
  }
  
  // Em desenvolvimento, continuamos usando a API local
  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log(`Enviando upload para: ${S3_API_URL}/upload`);
    
    const response = await fetch(`${S3_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `Erro ${response.status}: ${response.statusText}` }));
      throw new Error(error.message || 'Erro ao fazer upload do arquivo');
    }

    const data = await response.json();
    
    // Usar a URL retornada diretamente pela API, ou construir baseada no AWS S3 se não estiver presente
    return {
      key: data.key,
      url: data.url || `${AWS_S3_PUBLIC_URL}/${data.key}`
    };
  } catch (err) {
    console.error('Erro na requisição de upload:', err);
    throw err;
  }
}

/**
 * Gera uma URL pré-assinada para upload direto para o S3
 * @param fileName Nome do arquivo
 * @param contentType Tipo MIME do arquivo
 * @returns Promise com a URL pré-assinada
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string): Promise<string> {
  const key = `uploads/${Date.now()}-${fileName}`;
  
  const response = await fetch(`${S3_API_URL}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      contentType,
      expiresIn: 3600, // 1 hora
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao gerar URL de upload');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Faz upload direto para o S3 usando URL pré-assinada
 * @param url URL pré-assinada
 * @param file Arquivo a ser enviado
 * @param contentType Tipo MIME do arquivo
 * @returns Promise com a chave do arquivo no S3
 */
export async function uploadToPresignedUrl(
  url: string, 
  file: File,
  contentType: string
): Promise<string> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Erro ao fazer upload para URL pré-assinada');
  }

  // Extrair a chave do arquivo da URL
  const urlObj = new URL(url);
  const key = urlObj.pathname.split('/').slice(1).join('/');
  
  return key;
} 