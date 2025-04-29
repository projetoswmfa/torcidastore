// Serviço para interação com a API de armazenamento S3 + Supabase
import { supabase } from '../supabase/client';

// Verificar ambiente e definir URL padrão apropriada
const isProduction = import.meta.env.PROD === true;
const defaultApiUrl = isProduction 
  ? 'https://torcida-store.pages.dev/api' // URL de produção na Cloudflare Pages
  : 'http://localhost:3000/api'; // URL de desenvolvimento

const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

interface FileMetadata {
  id: string;
  file_key: string;
  file_path: string;
  s3_url: string;
  content_type: string;
  size: number;
  user_id: string;
  folder: string;
  created_at: string;
  updated_at: string;
  additional_data: Record<string, any>;
}

interface UploadResult {
  key: string;
  url: string;
  metadata: FileMetadata;
}

/**
 * Faz upload de um arquivo para o S3 e armazena metadados no Supabase
 * @param file Arquivo a ser enviado
 * @param folder Pasta onde o arquivo será armazenado
 * @param additionalMetadata Metadados adicionais para armazenar
 * @returns Resultado do upload com URL e metadados
 */
export async function uploadFile(
  file: File,
  folder: string = 'products',
  additionalMetadata: Record<string, any> = {}
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  // Adicionar metadados como JSON
  formData.append('metadata', JSON.stringify(additionalMetadata));

  const response = await fetch(`${API_URL}/s3/upload-with-metadata`, {
    method: 'POST',
    body: formData,
    headers: {
      // Não definimos Content-Type pois o FormData já define automaticamente
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao fazer upload do arquivo');
  }

  return await response.json();
}

/**
 * Busca arquivos por metadados
 * @param filters Filtros para busca 
 * @param options Opções como limit, offset e orderBy
 * @returns Lista de arquivos que correspondem aos critérios
 */
export async function searchFilesByMetadata(
  filters: Record<string, any> = {},
  options: { limit?: number; offset?: number; orderBy?: string; ascending?: boolean } = {}
): Promise<FileMetadata[]> {
  const response = await fetch(`${API_URL}/s3/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filters, options })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao buscar arquivos');
  }

  return await response.json();
}

/**
 * Lista arquivos em uma pasta
 * @param prefix Prefixo (pasta) para listar
 * @returns Lista de arquivos com metadados
 */
export async function listFiles(prefix: string = ''): Promise<any[]> {
  const response = await fetch(`${API_URL}/s3/files?prefix=${encodeURIComponent(prefix)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao listar arquivos');
  }

  return await response.json();
}

/**
 * Exclui um arquivo do S3 e seus metadados do Supabase
 * @param key Chave/caminho do arquivo
 * @returns Status da operação
 */
export async function deleteFile(key: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/s3/files/${encodeURIComponent(key)}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao excluir arquivo');
  }

  return await response.json();
}

/**
 * Obtém metadados completos de um arquivo
 * @param key Chave/caminho do arquivo
 * @returns Metadados do arquivo
 */
export async function getFileMetadata(key: string): Promise<any> {
  const response = await fetch(`${API_URL}/s3/metadata/${encodeURIComponent(key)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao obter metadados do arquivo');
  }

  return await response.json();
} 