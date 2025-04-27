const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

async function testarConexao() {
  try {
    logger.info('Iniciando teste de conexão com S3...');
    
    // Tenta listar arquivos (operação básica)
    const resultado = await s3Service.listFiles('', 1);
    
    logger.info('Conexão com S3 estabelecida com sucesso!');
    logger.info('Informações do bucket:', {
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      arquivosEncontrados: resultado.Contents ? resultado.Contents.length : 0
    });

    return true;
  } catch (error) {
    logger.error('Erro ao conectar com S3:', {
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId
    });
    return false;
  }
}

// Executa o teste
testarConexao().then(sucesso => {
  if (!sucesso) {
    process.exit(1);
  }
}); 