// Serviço de comunicação com a API AWS S3
// Esta integração permite fazer upload de imagens para o AWS S3

// URL base da API S3
const S3_API_URL = import.meta.env.VITE_AWS_S3_API_URL || 'http://localhost:3001/api/s3';
const AWS_S3_BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME || 'torcidastore';
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'sa-east-1';

/**
 * Faz upload de um arquivo para o AWS S3
 * @param file Arquivo a ser enviado
 * @returns Promise com a resposta contendo a chave do arquivo e URL
 */
export async function uploadFileToS3(file: File): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${S3_API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao fazer upload do arquivo');
  }

  const data = await response.json();
  
  // Usar a URL retornada diretamente pela API, ou construir baseada no AWS S3 se não estiver presente
  return {
    key: data.key,
    url: data.url || `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${data.key}`
  };
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