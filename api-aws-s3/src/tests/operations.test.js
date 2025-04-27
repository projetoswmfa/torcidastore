const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

async function testarOperacoes() {
  try {
    logger.info('Iniciando testes de operações do S3...');

    // 1. Teste de Upload
    logger.info('1. Testando upload de arquivo...');
    const conteudoTeste = 'Arquivo de teste ' + Date.now();
    const nomeArquivo = `teste-${Date.now()}.txt`;
    const buffer = Buffer.from(conteudoTeste);
    
    const resultadoUpload = await s3Service.uploadFile(
      buffer,
      nomeArquivo,
      'text/plain'
    );
    logger.info('Upload realizado com sucesso:', resultadoUpload);

    // 2. Teste de Listagem
    logger.info('2. Testando listagem de arquivos...');
    const resultadoLista = await s3Service.listFiles();
    logger.info(`Arquivos encontrados: ${resultadoLista.Contents.length}`);

    // 3. Teste de Metadados
    logger.info('3. Testando obtenção de metadados...');
    const metadados = await s3Service.getFileMetadata(nomeArquivo);
    logger.info('Metadados do arquivo:', {
      contentType: metadados.ContentType,
      tamanho: metadados.ContentLength,
      ultimaModificacao: metadados.LastModified
    });

    // 4. Teste de URL pré-assinada
    logger.info('4. Testando geração de URL pré-assinada...');
    const urlDownload = await s3Service.generateDownloadUrl(nomeArquivo);
    logger.info('URL de download gerada:', urlDownload);

    // 5. Teste de Download
    logger.info('5. Testando download do arquivo...');
    const arquivoBaixado = await s3Service.downloadFile(nomeArquivo);
    const conteudoBaixado = await arquivoBaixado.Body.transformToString();
    logger.info('Conteúdo do arquivo baixado:', conteudoBaixado);

    // 6. Teste de Cópia
    logger.info('6. Testando cópia de arquivo...');
    const novoNome = `copia-${nomeArquivo}`;
    const resultadoCopia = await s3Service.copyFile(nomeArquivo, novoNome);
    logger.info('Arquivo copiado com sucesso:', resultadoCopia);

    // 7. Teste de Deleção
    logger.info('7. Testando deleção de arquivos...');
    await s3Service.deleteFile(nomeArquivo);
    await s3Service.deleteFile(novoNome);
    logger.info('Arquivos deletados com sucesso');

    logger.info('Todos os testes completados com sucesso! ✅');
    return true;
  } catch (error) {
    logger.error('Erro durante os testes:', {
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Executa os testes
testarOperacoes().then(sucesso => {
  if (!sucesso) {
    process.exit(1);
  }
}); 