// Script para iniciar ambos os servidores (frontend e API AWS S3)
// Dependências necessárias: concurrently
// Execute com: node start-servers.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando servidores para o Jersey League Shop');

// Verificar o arquivo .env para a API S3
const apiEnvPath = path.join(__dirname, 'api-aws-s3', '.env');
const frontendEnvPath = path.join(__dirname, '.env.local');

// Verificar ambiente da API AWS S3
if (!fs.existsSync(apiEnvPath)) {
  console.log('⚠️ Arquivo .env não encontrado para a API AWS S3');
  console.log('ℹ️ Você deve criar um arquivo .env em api-aws-s3/ com base no seguinte modelo:');
  console.log(`
# Configurações do Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Configurações do AWS S3
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=seu-bucket-s3

# Configurações de Upload
MAX_FILE_SIZE=10485760 # 10MB em bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

# Configurações do Supabase (opcional, para integração de metadados)
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_KEY=sua_chave_servico_supabase
  `);
}

// Verificar ambiente do frontend
if (!fs.existsSync(frontendEnvPath)) {
  console.log('⚠️ Arquivo .env.local não encontrado para o frontend');
  console.log('ℹ️ Você deve criar um arquivo .env.local na raiz do projeto com base no seguinte modelo:');
  console.log(`
# Configurações da API AWS S3
VITE_AWS_S3_API_URL=http://localhost:3000/api/s3
VITE_AWS_S3_BUCKET_NAME=jersey-league-shop
VITE_AWS_REGION=us-east-1

# Configurações do Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
  `);
}

// Iniciar servidor da API AWS S3
console.log('📡 Iniciando servidor da API AWS S3...');
const s3ServerProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'api-aws-s3'),
  shell: true,
  stdio: 'pipe'
});

// Iniciar servidor frontend Vite
console.log('🌐 Iniciando servidor frontend...');
const frontendProcess = spawn('npm', ['run', 'vite'], {
  cwd: __dirname,
  shell: true,
  stdio: 'pipe'
});

// Gerenciar saída do servidor API AWS S3
s3ServerProcess.stdout.on('data', (data) => {
  console.log(`[API S3] ${data.toString().trim()}`);
});

s3ServerProcess.stderr.on('data', (data) => {
  console.error(`[API S3 ERROR] ${data.toString().trim()}`);
});

// Gerenciar saída do servidor frontend
frontendProcess.stdout.on('data', (data) => {
  console.log(`[FRONTEND] ${data.toString().trim()}`);
});

frontendProcess.stderr.on('data', (data) => {
  console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
});

// Gerenciar encerramento
process.on('SIGINT', () => {
  console.log('Encerrando servidores...');
  s3ServerProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit();
});

// Log de encerramento
s3ServerProcess.on('close', (code) => {
  console.log(`Servidor API S3 encerrado com código ${code}`);
});

frontendProcess.on('close', (code) => {
  console.log(`Servidor frontend encerrado com código ${code}`);
}); 