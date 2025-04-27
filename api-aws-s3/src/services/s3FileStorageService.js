const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Config');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Serviço de armazenamento que usa AWS S3 para armazenar arquivos
 * e Supabase para armazenar metadados
 */
class S3FileStorageService {
  constructor() {
    // Configuração do S3
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;

    // Inicializando o cliente Supabase para metadados
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      console.warn('Aviso: Credenciais do Supabase não configuradas. O armazenamento de metadados está desativado.');
      this.supabase = null;
    }
  }

  /**
   * Salva metadados do arquivo no Supabase
   * @private
   * @param {string} key - Caminho/nome do arquivo no S3
   * @param {Object} metadata - Metadados do arquivo
   */
  async _saveMetadata(key, metadata) {
    if (!this.supabase) return null;

    try {
      // Se existir um ID de usuário no caminho do arquivo, extraímos
      const pathParts = key.split('/');
      const userId = pathParts.length > 1 ? pathParts[0] : null;
      
      const { data, error } = await this.supabase
        .from('file_metadata')
        .insert({
          file_key: key,
          file_path: key,
          s3_url: metadata.url || `https://${this.bucketName}.s3.amazonaws.com/${key}`,
          content_type: metadata.contentType,
          size: metadata.size || 0,
          user_id: userId,
          folder: pathParts.length > 2 ? pathParts[1] : null,
          additional_data: metadata.additional || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar metadados no Supabase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exceção ao salvar metadados no Supabase:', error);
      return null;
    }
  }

  /**
   * Recupera metadados do arquivo do Supabase
   * @private
   * @param {string} key - Caminho/nome do arquivo
   */
  async _getMetadata(key) {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('file_metadata')
        .select('*')
        .eq('file_key', key)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Não é erro de "não encontrado"
          console.error('Erro ao recuperar metadados do Supabase:', error);
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exceção ao recuperar metadados do Supabase:', error);
      return null;
    }
  }

  /**
   * Atualiza metadados do arquivo no Supabase
   * @private
   * @param {string} key - Caminho/nome do arquivo
   * @param {Object} metadata - Metadados atualizados
   */
  async _updateMetadata(key, metadata) {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('file_metadata')
        .update(metadata)
        .eq('file_key', key)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar metadados no Supabase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exceção ao atualizar metadados no Supabase:', error);
      return null;
    }
  }

  /**
   * Remove metadados do arquivo do Supabase
   * @private
   * @param {string} key - Caminho/nome do arquivo
   */
  async _deleteMetadata(key) {
    if (!this.supabase) return null;

    try {
      const { error } = await this.supabase
        .from('file_metadata')
        .delete()
        .eq('file_key', key);

      if (error) {
        console.error('Erro ao remover metadados do Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exceção ao remover metadados do Supabase:', error);
      return false;
    }
  }

  /**
   * Faz upload de um arquivo para o S3 e armazena metadados no Supabase
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} key - Caminho/nome do arquivo no S3
   * @param {string} contentType - Tipo do conteúdo (MIME type)
   * @param {Object} additionalMetadata - Metadados adicionais para armazenar no Supabase
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadFile(fileBuffer, key, contentType, additionalMetadata = {}) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    });

    const result = await s3Client.send(command);
    
    // URL pública do arquivo no S3
    const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    
    // Salvar metadados no Supabase se disponível
    const metadata = {
      url: fileUrl,
      contentType: contentType,
      size: fileBuffer.length,
      eTag: result.ETag,
      versionId: result.VersionId,
      additional: additionalMetadata
    };
    
    const savedMetadata = await this._saveMetadata(key, metadata);

    return {
      key,
      url: fileUrl,
      eTag: result.ETag,
      versionId: result.VersionId,
      metadata: savedMetadata
    };
  }

  /**
   * Gera uma URL pré-assinada para upload direto
   * @param {string} key - Caminho/nome do arquivo no S3
   * @param {string} contentType - Tipo do conteúdo (MIME type)
   * @param {number} expiresIn - Tempo de expiração em segundos
   * @returns {Promise<string>} URL pré-assinada
   */
  async generateUploadUrl(key, contentType, expiresIn = 3600) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    // Pré-registrar metadados básicos no Supabase
    await this._saveMetadata(key, {
      contentType: contentType,
      url: `https://${this.bucketName}.s3.amazonaws.com/${key}`
    });
    
    return url;
  }

  /**
   * Gera uma URL pré-assinada para download
   * @param {string} key - Caminho/nome do arquivo no S3
   * @param {number} expiresIn - Tempo de expiração em segundos
   * @returns {Promise<string>} URL pré-assinada
   */
  async generateDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Download de um arquivo do S3
   * @param {string} key - Caminho/nome do arquivo no S3
   * @returns {Promise<Object>} Stream do arquivo
   */
  async downloadFile(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    return await s3Client.send(command);
  }

  /**
   * Deleta um arquivo do S3 e seus metadados do Supabase
   * @param {string} key - Caminho/nome do arquivo no S3
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const result = await s3Client.send(command);
    
    // Remover metadados do Supabase se disponível
    await this._deleteMetadata(key);

    return result;
  }

  /**
   * Lista arquivos em um diretório do S3 e enriquece com metadados do Supabase
   * @param {string} prefix - Prefixo/diretório para listar
   * @param {number} maxKeys - Número máximo de itens para retornar
   * @returns {Promise<Object>} Lista de arquivos
   */
  async listFiles(prefix = '', maxKeys = 1000) {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys
    });

    const result = await s3Client.send(command);
    
    // Enriquecer com metadados do Supabase se disponível
    if (this.supabase && result.Contents && result.Contents.length > 0) {
      try {
        // Buscar todos os metadados correspondentes ao prefixo
        const { data: metadataList } = await this.supabase
          .from('file_metadata')
          .select('*')
          .like('file_key', `${prefix}%`)
          .limit(maxKeys);
        
        if (metadataList && metadataList.length > 0) {
          // Criar um mapa para busca rápida
          const metadataMap = metadataList.reduce((acc, item) => {
            acc[item.file_key] = item;
            return acc;
          }, {});
          
          // Adicionar metadados aos resultados
          result.Contents = result.Contents.map(item => {
            const metadata = metadataMap[item.Key];
            if (metadata) {
              return {
                ...item,
                Metadata: metadata,
                Url: metadata.s3_url
              };
            }
            return item;
          });
        }
      } catch (error) {
        console.error('Erro ao buscar metadados para listagem:', error);
      }
    }
    
    return result;
  }

  /**
   * Obtém metadados de um arquivo do S3 e do Supabase
   * @param {string} key - Caminho/nome do arquivo no S3
   * @returns {Promise<Object>} Metadados do arquivo
   */
  async getFileMetadata(key) {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const s3Metadata = await s3Client.send(command);
    
    // Buscar metadados adicionais do Supabase
    const supabaseMetadata = await this._getMetadata(key);
    
    // Combinar os metadados
    if (supabaseMetadata) {
      return {
        ...s3Metadata,
        SupabaseMetadata: supabaseMetadata,
        Url: supabaseMetadata.s3_url
      };
    }
    
    return s3Metadata;
  }

  /**
   * Copia um arquivo dentro do S3 e atualiza metadados no Supabase
   * @param {string} sourceKey - Caminho/nome do arquivo origem
   * @param {string} destinationKey - Caminho/nome do arquivo destino
   * @returns {Promise<Object>} Resultado da cópia
   */
  async copyFile(sourceKey, destinationKey) {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey
    });

    const result = await s3Client.send(command);
    
    // Copiar metadados para o novo arquivo no Supabase se disponível
    if (this.supabase) {
      const sourceMetadata = await this._getMetadata(sourceKey);
      if (sourceMetadata) {
        // Ajustar metadados para o novo arquivo
        const newMetadata = {
          file_key: destinationKey,
          file_path: destinationKey,
          s3_url: `https://${this.bucketName}.s3.amazonaws.com/${destinationKey}`,
          content_type: sourceMetadata.content_type,
          size: sourceMetadata.size,
          user_id: sourceMetadata.user_id,
          folder: destinationKey.split('/').length > 2 ? destinationKey.split('/')[1] : null,
          additional_data: sourceMetadata.additional_data
        };
        
        await this._saveMetadata(destinationKey, {
          contentType: sourceMetadata.content_type,
          size: sourceMetadata.size,
          url: newMetadata.s3_url,
          additional: sourceMetadata.additional_data
        });
      }
    }
    
    return result;
  }

  /**
   * Busca arquivos por metadados no Supabase
   * @param {Object} filters - Filtros a aplicar na busca
   * @param {Object} options - Opções adicionais (limit, offset, etc)
   * @returns {Promise<Object[]>} Lista de arquivos correspondentes
   */
  async searchFilesByMetadata(filters = {}, options = { limit: 100, offset: 0 }) {
    if (!this.supabase) {
      throw new Error('Supabase não está configurado. Não é possível realizar buscas por metadados.');
    }

    try {
      let query = this.supabase
        .from('file_metadata')
        .select('*');
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Se for um objeto, assumimos que são operações especiais
          // Ex: { size: { gt: 1000 } }
          const [op, val] = Object.entries(value)[0];
          switch (op) {
            case 'eq': query = query.eq(key, val); break;
            case 'gt': query = query.gt(key, val); break;
            case 'lt': query = query.lt(key, val); break;
            case 'gte': query = query.gte(key, val); break;
            case 'lte': query = query.lte(key, val); break;
            case 'in': query = query.in(key, val); break;
            case 'contains': query = query.contains(key, val); break;
            case 'like': query = query.like(key, `%${val}%`); break;
          }
        } else {
          // Valor simples, usamos igualdade
          query = query.eq(key, value);
        }
      });
      
      // Aplicar opções de paginação
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      }
      
      // Ordenar resultados
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.ascending !== false 
        });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos por metadados:', error);
      throw error;
    }
  }
}

module.exports = new S3FileStorageService(); 