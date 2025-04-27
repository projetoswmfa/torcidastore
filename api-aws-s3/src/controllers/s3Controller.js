const s3Service = require('../services/s3Service');
const { Readable } = require('stream');

class S3Controller {
  /**
   * Upload de arquivo
   */
  async uploadFile(req, res) {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const key = `uploads/${Date.now()}-${file.originalname}`;
    const result = await s3Service.uploadFile(file.buffer, key, file.mimetype);

    res.status(201).json({
      message: 'Arquivo enviado com sucesso',
      ...result
    });
  }

  /**
   * Gerar URL pré-assinada para upload
   */
  async getUploadUrl(req, res) {
    const { key, contentType, expiresIn } = req.body;

    if (!key || !contentType) {
      return res.status(400).json({ error: 'key e contentType são obrigatórios' });
    }

    const url = await s3Service.generateUploadUrl(key, contentType, expiresIn);
    res.json({ url });
  }

  /**
   * Gerar URL pré-assinada para download
   */
  async getDownloadUrl(req, res) {
    const { key, expiresIn } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'key é obrigatório' });
    }

    const url = await s3Service.generateDownloadUrl(key, expiresIn);
    res.json({ url });
  }

  /**
   * Download de arquivo
   */
  async downloadFile(req, res) {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'key é obrigatório' });
    }

    const result = await s3Service.downloadFile(key);
    
    res.setHeader('Content-Type', result.ContentType);
    res.setHeader('Content-Length', result.ContentLength);
    
    const stream = result.Body;
    if (stream instanceof Readable) {
      stream.pipe(res);
    } else {
      res.send(await stream.transformToByteArray());
    }
  }

  /**
   * Deletar arquivo
   */
  async deleteFile(req, res) {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'key é obrigatório' });
    }

    await s3Service.deleteFile(key);
    res.json({ message: 'Arquivo deletado com sucesso' });
  }

  /**
   * Listar arquivos
   */
  async listFiles(req, res) {
    const { prefix = '', maxKeys } = req.query;
    const result = await s3Service.listFiles(prefix, maxKeys);
    
    const files = result.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      eTag: item.ETag
    }));

    res.json({
      files,
      isTruncated: result.IsTruncated,
      nextContinuationToken: result.NextContinuationToken
    });
  }

  /**
   * Obter metadados do arquivo
   */
  async getFileMetadata(req, res) {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'key é obrigatório' });
    }

    const metadata = await s3Service.getFileMetadata(key);
    res.json({
      contentType: metadata.ContentType,
      contentLength: metadata.ContentLength,
      lastModified: metadata.LastModified,
      eTag: metadata.ETag,
      metadata: metadata.Metadata
    });
  }

  /**
   * Copiar arquivo
   */
  async copyFile(req, res) {
    const { sourceKey, destinationKey } = req.body;

    if (!sourceKey || !destinationKey) {
      return res.status(400).json({ error: 'sourceKey e destinationKey são obrigatórios' });
    }

    const result = await s3Service.copyFile(sourceKey, destinationKey);
    res.json({
      message: 'Arquivo copiado com sucesso',
      eTag: result.CopyObjectResult.ETag,
      lastModified: result.CopyObjectResult.LastModified
    });
  }

  /**
   * Upload de arquivo com metadados
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async uploadWithMetadata(req, res) {
    try {
      // O arquivo é processado pelo multer e disponibilizado em req.file
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      console.log('Iniciando upload com metadados:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Extrair pasta do formulário ou usar 'uploads' como padrão
      const folder = req.body.folder || 'uploads';
      
      // Extrair metadados do formulário
      let metadata = {};
      if (req.body.metadata) {
        try {
          metadata = JSON.parse(req.body.metadata);
        } catch (err) {
          console.error('Erro ao processar metadados:', err);
        }
      }

      // Gerar nome do arquivo baseado em timestamp para evitar colisões
      const timestamp = Date.now();
      const fileExt = req.file.originalname.split('.').pop();
      const userId = metadata.userId || 'anonymous';

      // Criar caminho do arquivo no formato userId/folder/timestamp-filename.ext
      const key = `${userId}/${folder}/${timestamp}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      console.log('Preparando upload para caminho:', key);

      // Upload do arquivo para o Supabase Storage com metadados
      const result = await s3Service.uploadFile(
        req.file.buffer, 
        key, 
        req.file.mimetype,
        metadata
      );

      console.log('Upload concluído com sucesso:', {
        key: result.key,
        url: result.url || 'URL não disponível'
      });

      // Enviar resposta com URL e metadados
      res.status(201).json({
        key: result.key,
        url: result.url,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Erro no upload com metadados:', error);
      res.status(500).json({ message: 'Erro ao fazer upload do arquivo', error: error.message });
    }
  }

  /**
   * Buscar arquivos por metadados
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async searchByMetadata(req, res) {
    try {
      const { filters, options } = req.body;
      
      // Validar filtros
      if (!filters || typeof filters !== 'object') {
        return res.status(400).json({ message: 'Filtros inválidos' });
      }
      
      // Buscar arquivos com os filtros fornecidos
      const files = await s3Service.searchFilesByMetadata(filters, options);
      
      res.json(files);
    } catch (error) {
      console.error('Erro na busca por metadados:', error);
      res.status(500).json({ message: 'Erro ao buscar arquivos', error: error.message });
    }
  }

  /**
   * Obter metadados completos de um arquivo
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async getFileMetadataFull(req, res) {
    try {
      const { key } = req.params;
      
      if (!key) {
        return res.status(400).json({ message: 'Chave do arquivo não fornecida' });
      }
      
      const metadata = await s3Service.getFileMetadata(key);
      
      if (!metadata) {
        return res.status(404).json({ message: 'Arquivo não encontrado' });
      }
      
      res.json(metadata);
    } catch (error) {
      console.error('Erro ao obter metadados:', error);
      res.status(500).json({ message: 'Erro ao obter metadados do arquivo', error: error.message });
    }
  }

  /**
   * Configura CORS para o bucket S3
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  async configureBucketCors(req, res) {
    try {
      const result = await s3Service.configureBucketCors();
      
      res.json({
        success: true,
        message: 'Configuração CORS aplicada com sucesso',
        result
      });
    } catch (error) {
      console.error('Erro ao configurar CORS do bucket:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao configurar CORS',
        error: error.message
      });
    }
  }
}

module.exports = new S3Controller(); 