/**
 * Exemplo de utilização do Supabase Storage
 * 
 * Este script demonstra como usar o Supabase Storage para operações básicas:
 * - Upload de arquivo
 * - Download de arquivo
 * - Listagem de arquivos
 * - Geração de URLs pré-assinadas
 */

const fs = require('fs');
const path = require('path');
const supabaseService = require('../services/s3Service'); // Usando nossa implementação do Supabase

// Caminho para um arquivo de teste
const TEST_FILE_PATH = path.join(__dirname, '../../../test-file.jpg');
const UPLOAD_KEY = 'example/test-upload.jpg';

async function runExample() {
    try {
        console.log('Iniciando demonstração do Supabase Storage...\n');

        // 1. Upload de arquivo
        console.log('1. Fazendo upload de arquivo...');
        const fileBuffer = fs.readFileSync(TEST_FILE_PATH);
        const uploadResult = await supabaseService.uploadFile(
            fileBuffer,
            UPLOAD_KEY,
            'image/jpeg'
        );
        console.log('Arquivo enviado com sucesso:', uploadResult);
        console.log('----------------------\n');

        // 2. Listagem de arquivos
        console.log('2. Listando arquivos do bucket...');
        const listResult = await supabaseService.listFiles('example/');
        console.log(`Encontrados ${listResult.Contents.length} arquivos:`);
        listResult.Contents.forEach(file => {
            console.log(`- ${file.Key} (${file.Size} bytes)`);
        });
        console.log('----------------------\n');

        // 3. Gerar URL pré-assinada para download
        console.log('3. Gerando URL pré-assinada para download...');
        const downloadUrl = await supabaseService.generateDownloadUrl(UPLOAD_KEY, 60);
        console.log('URL para download (válida por 60 segundos):', downloadUrl);
        console.log('----------------------\n');

        // 4. Gerar URL pré-assinada para upload
        console.log('4. Gerando URL pré-assinada para upload...');
        const uploadUrl = await supabaseService.generateUploadUrl(
            'example/upload-via-url.jpg',
            'image/jpeg',
            300
        );
        console.log('URL para upload (válida por 300 segundos):', uploadUrl);
        console.log('----------------------\n');

        // 5. Obter metadados do arquivo
        console.log('5. Obtendo metadados do arquivo...');
        const metadata = await supabaseService.getFileMetadata(UPLOAD_KEY);
        console.log('Metadados do arquivo:', metadata);
        console.log('----------------------\n');

        // 6. Download do arquivo
        console.log('6. Fazendo download do arquivo...');
        const downloadResult = await supabaseService.downloadFile(UPLOAD_KEY);
        console.log('Arquivo baixado com sucesso:', {
            contentType: downloadResult.ContentType,
            contentLength: downloadResult.ContentLength
        });
        console.log('----------------------\n');

        console.log('Demonstração concluída com sucesso!');
    } catch (error) {
        console.error('Erro durante a demonstração:', error);
    }
}

// Executar o exemplo se o script for chamado diretamente
if (require.main === module) {
    // Verificar se o arquivo de teste existe
    if (!fs.existsSync(TEST_FILE_PATH)) {
        console.error(`Arquivo de teste não encontrado em ${TEST_FILE_PATH}`);
        console.log('Crie um arquivo de teste ou ajuste o caminho no script.');
        process.exit(1);
    }

    runExample();
}

module.exports = { runExample }; 