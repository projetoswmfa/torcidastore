require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const s3Routes = require('./routes/s3Routes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Documentação Swagger
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API AWS S3',
    version: '1.0.0',
    description: 'API para interação com AWS S3'
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: 'Servidor de Desenvolvimento'
    }
  ],
  paths: {
    '/api/s3/upload': {
      post: {
        summary: 'Upload de arquivo',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Arquivo enviado com sucesso'
          }
        }
      }
    },
    '/api/s3/upload-url': {
      post: {
        summary: 'Gerar URL pré-assinada para upload',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['key', 'contentType'],
                properties: {
                  key: {
                    type: 'string'
                  },
                  contentType: {
                    type: 'string'
                  },
                  expiresIn: {
                    type: 'number'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'URL gerada com sucesso'
          }
        }
      }
    },
    '/api/s3/download/{key}': {
      get: {
        summary: 'Download de arquivo',
        parameters: [
          {
            in: 'path',
            name: 'key',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          200: {
            description: 'Arquivo baixado com sucesso'
          }
        }
      }
    },
    '/api/s3/files': {
      get: {
        summary: 'Listar arquivos',
        parameters: [
          {
            in: 'query',
            name: 'prefix',
            schema: {
              type: 'string'
            }
          },
          {
            in: 'query',
            name: 'maxKeys',
            schema: {
              type: 'number'
            }
          }
        ],
        responses: {
          200: {
            description: 'Lista de arquivos'
          }
        }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rotas
app.use('/api/s3', s3Routes);

// Middleware de erro
app.use(errorHandler);

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Servidor rodando na porta ${port}`);
}); 