const express = require('express');
const multer = require('multer');
const s3Controller = require('../controllers/s3Controller');

const router = express.Router();

// Configuração do multer para processar upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');
    if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Rotas para operações no S3
router.post('/upload', upload.single('file'), s3Controller.uploadFile);
router.post('/upload-url', s3Controller.getUploadUrl);
router.get('/download-url/:key', s3Controller.getDownloadUrl);
router.get('/download/:key', s3Controller.downloadFile);
router.delete('/files/:key', s3Controller.deleteFile);
router.get('/files', s3Controller.listFiles);
router.get('/files/:key/metadata', s3Controller.getFileMetadata);
router.post('/files/copy', s3Controller.copyFile);

// Rota para upload com metadados
router.post('/upload-with-metadata', upload.single('file'), s3Controller.uploadWithMetadata);

// Rota para buscar arquivos por metadados
router.post('/search', s3Controller.searchByMetadata);

// Rota para obter metadados completos de um arquivo
router.get('/metadata/:key', s3Controller.getFileMetadata);

// Nova rota para configurar CORS
router.post('/fix-cors', s3Controller.configureBucketCors);

module.exports = router; 