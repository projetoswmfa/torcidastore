import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testarUpload() {
  console.log('Iniciando teste de upload...');
  
  try {
    // Usar favicon.ico como arquivo de teste
    const imagePath = path.join(__dirname, 'public', 'favicon.ico');
    
    if (!fs.existsSync(imagePath)) {
      console.error('Arquivo não encontrado em:', imagePath);
      return;
    }
    
    console.log('Arquivo encontrado:', imagePath);
    
    const fileBuffer = fs.readFileSync(imagePath);
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'teste-upload.ico',
      contentType: 'image/x-icon'
    });
    
    console.log('Enviando arquivo para a API...');
    
    const response = await fetch('http://localhost:3000/api/s3/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Resposta da API:', result);
    console.log('URL da imagem:', `https://torcidastore.s3.sa-east-1.amazonaws.com/${result.key}`);
    
    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao executar o teste:', error.message);
  }
}

testarUpload(); 