const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Erro:', {
    message: err.message,
    method: req.method,
    path: req.path
  });

  // Erro do Multer
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'Erro no upload do arquivo',
      detail: err.message
    });
  }

  // Erro do AWS SDK
  if (err.name === 'S3ServiceException' || err.code?.startsWith('S3') || err.name?.includes('AWS')) {
    return res.status(500).json({
      error: 'Erro no serviço AWS S3',
      detail: err.message
    });
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      detail: err.message
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

module.exports = errorHandler; 