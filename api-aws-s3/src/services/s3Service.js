const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  PutBucketCorsCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Config');
require('dotenv').config();

class AWSS3Service {
  constructor() {
    // Inicializando o cliente AWS S3
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('Faltam variáveis de ambiente do AWS!', {
        accessKey: !!process.env.AWS_ACCESS_KEY_ID,
        secretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      });
    }
    
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.region = process.env.AWS_REGION;
    
    console.log(`Inicializando AWSS3Service com bucket: ${this.bucketName} na região ${this.region}`);
  }

  /**
   * Faz upload de um arquivo para o AWS S3
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} key - Caminho/nome do arquivo no S3
   * @param {string} contentType - Tipo do conteúdo (MIME type)
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadFile(fileBuffer, key, contentType, metadata = {}) {
    try {
      console.log(`Tentando fazer upload para ${this.bucketName}/${key} (${contentType})`);
      
      // Preparar os metadados
      const metadataObj = {};
      for (const [key, value] of Object.entries(metadata)) {
        metadataObj[`x-amz-meta-${key}`] = value.toString();
      }
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: metadataObj
      };
      
      // Executar o comando de upload
      const command = new PutObjectCommand(params);
      const result = await s3Client.send(command);
      
      // Gerar URL pública
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      
      return {
        key,
        eTag: result.ETag,
        url,
        metadata
      };
    } catch (error) {
      console.error('Erro no método uploadFile:', error);
      throw error;
    }
  }

  /**
   * Gera uma URL pré-assinada para upload direto
   * @param {string} key - Caminho/nome do arquivo no S3
   * @param {string} contentType - Tipo do conteúdo (MIME type)
   * @param {number} expiresIn - Tempo de expiração em segundos
   * @returns {Promise<string>} URL pré-assinada
   */
  async generateUploadUrl(key, contentType, expiresIn = 3600) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType
    };
    
    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return { url };
  }

  /**
   * Gera uma URL pré-assinada para download
   * @param {string} key - Caminho/nome do arquivo no S3
   * @param {number} expiresIn - Tempo de expiração em segundos
   * @returns {Promise<string>} URL pré-assinada
   */
  async generateDownloadUrl(key, expiresIn = 3600) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };
    
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return url;
  }

  /**
   * Download de um arquivo do S3
   * @param {string} key - Caminho/nome do arquivo no S3
   * @returns {Promise<Object>} Stream do arquivo
   */
  async downloadFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };
    
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    
    return {
      Body: response.Body,
      ContentType: response.ContentType,
      ContentLength: response.ContentLength
    };
  }

  /**
   * Deleta um arquivo do S3
   * @param {string} key - Caminho/nome do arquivo no S3
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };
    
    const command = new DeleteObjectCommand(params);
    const result = await s3Client.send(command);
    
    return { data: result };
  }

  /**
   * Lista arquivos em um diretório do S3
   * @param {string} prefix - Prefixo/diretório para listar
   * @param {number} maxKeys - Número máximo de itens para retornar
   * @returns {Promise<Object>} Lista de arquivos
   */
  async listFiles(prefix = '', maxKeys = 1000) {
    const params = {
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys
    };
    
    const command = new ListObjectsV2Command(params);
    const result = await s3Client.send(command);
    
    return {
      Contents: result.Contents || [],
      IsTruncated: result.IsTruncated,
      NextContinuationToken: result.NextContinuationToken
    };
  }

  /**
   * Obtém metadados de um arquivo
   * @param {string} key - Caminho/nome do arquivo no S3
   * @returns {Promise<Object>} Metadados do arquivo
   */
  async getFileMetadata(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };
    
    const command = new HeadObjectCommand(params);
    const result = await s3Client.send(command);
    
    return {
      ContentType: result.ContentType,
      ContentLength: result.ContentLength,
      LastModified: result.LastModified,
      ETag: result.ETag,
      Metadata: result.Metadata
    };
  }

  /**
   * Copia um arquivo dentro do S3
   * @param {string} sourceKey - Caminho/nome do arquivo origem
   * @param {string} destinationKey - Caminho/nome do arquivo destino
   * @returns {Promise<Object>} Resultado da cópia
   */
  async copyFile(sourceKey, destinationKey) {
    const params = {
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey
    };
    
    const command = new CopyObjectCommand(params);
    const result = await s3Client.send(command);
    
    return {
      CopyObjectResult: {
        ETag: result.CopyObjectResult?.ETag,
        LastModified: result.CopyObjectResult?.LastModified
      }
    };
  }

  /**
   * Configura CORS para o bucket S3
   * @returns {Promise<Object>} Resultado da operação
   */
  async configureBucketCors() {
    try {
      const { PutBucketCorsCommand } = require('@aws-sdk/client-s3');
      
      const params = {
        Bucket: this.bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: ['*'], // Em produção, limitar para domínios específicos
              ExposeHeaders: ['ETag', 'x-amz-meta-*'],
              MaxAgeSeconds: 86400 // 1 dia
            }
          ]
        }
      };
      
      const command = new PutBucketCorsCommand(params);
      const result = await s3Client.send(command);
      
      console.log('Configuração CORS aplicada com sucesso!');
      
      return result;
    } catch (error) {
      console.error('Erro ao configurar CORS:', error);
      throw error;
    }
  }
}

module.exports = new AWSS3Service(); 