/**
 * Utilitários para integração com Supabase Storage
 * 
 * Este módulo contém funções auxiliares para facilitar a integração
 * do Supabase Storage com o frontend da aplicação.
 */

/**
 * Gera URL pública para um arquivo no bucket público
 * 
 * @param {Object} supabase - Cliente Supabase
 * @param {string} bucketName - Nome do bucket
 * @param {string} filePath - Caminho do arquivo no bucket
 * @returns {string} URL pública do arquivo
 */
function getPublicUrl(supabase, bucketName, filePath) {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Formata o tamanho do arquivo para exibição
 * 
 * @param {number} bytes - Tamanho em bytes
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Tamanho formatado (ex: 1.5 MB)
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Gera uma chave única para um arquivo baseada no timestamp e nome original
 * 
 * @param {string} userId - ID do usuário
 * @param {string} filename - Nome original do arquivo
 * @param {string} folder - Pasta onde o arquivo será armazenado (opcional)
 * @returns {string} Chave única para o arquivo
 */
function generateUniqueFileKey(userId, filename, folder = '') {
  const timestamp = new Date().getTime();
  const cleanFileName = filename.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase();
  return folder 
    ? `${userId}/${folder}/${timestamp}-${cleanFileName}`
    : `${userId}/${timestamp}-${cleanFileName}`;
}

/**
 * Verifica se um arquivo tem um tipo MIME permitido
 * 
 * @param {string} mimeType - Tipo MIME do arquivo
 * @param {string[]} allowedTypes - Array com os tipos MIME permitidos
 * @returns {boolean} Verdadeiro se o tipo for permitido
 */
function isAllowedFileType(mimeType, allowedTypes) {
  return allowedTypes.includes(mimeType);
}

/**
 * Extrai o nome do arquivo a partir da chave completa
 * 
 * @param {string} key - Chave completa do arquivo no storage
 * @returns {string} Nome do arquivo
 */
function extractFilenameFromKey(key) {
  return key.split('/').pop();
}

/**
 * Define o tipo de conteúdo a partir da extensão do arquivo
 * 
 * @param {string} filename - Nome do arquivo
 * @returns {string} Tipo de conteúdo MIME
 */
function getContentTypeFromFilename(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'zip': 'application/zip'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

module.exports = {
  getPublicUrl,
  formatFileSize,
  generateUniqueFileKey,
  isAllowedFileType,
  extractFilenameFromKey,
  getContentTypeFromFilename
}; 