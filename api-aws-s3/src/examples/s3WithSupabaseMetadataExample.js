/**
 * Exemplo de utilização do serviço de armazenamento S3 com metadados no Supabase
 * 
 * Este script demonstra como usar o serviço para:
 * - Upload de arquivo para o AWS S3
 * - Armazenar metadados no Supabase
 * - Buscar arquivos usando os metadados
 * - Listar arquivos com metadados enriquecidos
 */

const fs = require('fs');
const path = require('path');
const s3Service = require('../services/s3FileStorageService');

// Caminho para um arquivo de teste
const TEST_FILE_PATH = path.join(__dirname, '../../../test-file.jpg');
const UPLOAD_KEY = 'example/test-upload-s3.jpg';

async function runExample() {
    try {
        console.log('Iniciando demonstração do S3 com metadados no Supabase...\n');

        // 1. Upload de arquivo para o S3
        console.log('1. Fazendo upload de arquivo para o S3...');
        const fileBuffer = fs.readFileSync(TEST_FILE_PATH);
        
        // Metadados adicionais personalizados
        const additionalMetadata = {
            description: 'Arquivo de teste para demonstração',
            category: 'imagem',
            tags: ['teste', 'exemplo', 'demo'],
            isPublic: true,
            productId: 12345
        };
        
        const uploadResult = await s3Service.uploadFile(
            fileBuffer,
            UPLOAD_KEY,
            'image/jpeg',
            additionalMetadata
        );
        
        console.log('Arquivo enviado com sucesso:');
        console.log(' - Key:', uploadResult.key);
        console.log(' - URL:', uploadResult.url);
        console.log(' - Metadados salvos no Supabase:', uploadResult.metadata ? 'Sim' : 'Não');
        if (uploadResult.metadata) {
            console.log(' - ID no Supabase:', uploadResult.metadata.id);
        }
        console.log('----------------------\n');

        // 2. Buscar metadados do arquivo
        console.log('2. Obtendo metadados do arquivo...');
        const metadata = await s3Service.getFileMetadata(UPLOAD_KEY);
        console.log('Metadados do S3:');
        console.log(' - ContentType:', metadata.ContentType);
        console.log(' - ContentLength:', metadata.ContentLength);
        console.log(' - LastModified:', metadata.LastModified);
        
        if (metadata.SupabaseMetadata) {
            console.log('Metadados do Supabase:');
            console.log(' - URL:', metadata.SupabaseMetadata.s3_url);
            console.log(' - User ID:', metadata.SupabaseMetadata.user_id);
            console.log(' - Tipo de conteúdo:', metadata.SupabaseMetadata.content_type);
            console.log(' - Tamanho:', metadata.SupabaseMetadata.size);
            console.log(' - Dados adicionais:', JSON.stringify(metadata.SupabaseMetadata.additional_data, null, 2));
        }
        console.log('----------------------\n');

        // 3. Listar arquivos com metadados
        console.log('3. Listando arquivos do S3 com metadados...');
        const listResult = await s3Service.listFiles('example/');
        console.log(`Encontrados ${listResult.Contents?.length || 0} arquivos:`);
        
        if (listResult.Contents && listResult.Contents.length > 0) {
            listResult.Contents.forEach(item => {
                console.log(`- ${item.Key} (${item.Size} bytes)`);
                if (item.Metadata) {
                    console.log(`  * URL: ${item.Url || 'N/A'}`);
                    console.log(`  * Tipo: ${item.Metadata.content_type || 'N/A'}`);
                    if (item.Metadata.additional_data) {
                        try {
                            const additionalData = typeof item.Metadata.additional_data === 'string' 
                                ? JSON.parse(item.Metadata.additional_data) 
                                : item.Metadata.additional_data;
                                
                            if (additionalData.description) {
                                console.log(`  * Descrição: ${additionalData.description}`);
                            }
                            if (additionalData.tags) {
                                console.log(`  * Tags: ${additionalData.tags.join(', ')}`);
                            }
                        } catch (e) {
                            console.log(`  * Erro ao processar dados adicionais: ${e.message}`);
                        }
                    }
                }
            });
        }
        console.log('----------------------\n');

        // 4. Buscar arquivos por metadados
        console.log('4. Buscando arquivos por metadados no Supabase...');
        try {
            // Buscar por tipo de conteúdo
            const imageFiles = await s3Service.searchFilesByMetadata(
                { content_type: 'image/jpeg' },
                { limit: 10 }
            );
            
            console.log(`Encontrados ${imageFiles.length} arquivos de imagem:`);
            imageFiles.forEach(file => {
                console.log(`- ${file.file_key} (${file.size} bytes)`);
                console.log(`  * URL: ${file.s3_url}`);
            });
            
            // Buscar por metadados adicionais (requer PostgreSQL 12+)
            console.log('\nArquivos com tag "teste":');
            const taggedFiles = await s3Service.searchFilesByMetadata(
                // Usando contains para buscar tags em JSONB
                {},
                { limit: 10 }
            );
            
            // Filtramos manualmente porque a busca em JSONB pode variar por versão do PostgreSQL
            const filesWithTestTag = taggedFiles.filter(file => {
                try {
                    const additionalData = typeof file.additional_data === 'string'
                        ? JSON.parse(file.additional_data)
                        : file.additional_data;
                        
                    return additionalData.tags && additionalData.tags.includes('teste');
                } catch (e) {
                    return false;
                }
            });
            
            console.log(`Encontrados ${filesWithTestTag.length} arquivos com tag "teste":`);
            filesWithTestTag.forEach(file => {
                console.log(`- ${file.file_key}`);
            });
        } catch (err) {
            console.log('Erro ao buscar por metadados:', err.message);
            console.log('Nota: A busca por metadados requer conexão com o Supabase.');
        }
        console.log('----------------------\n');

        // 5. Gerar URL pré-assinada para download
        console.log('5. Gerando URL pré-assinada para download...');
        const downloadUrl = await s3Service.generateDownloadUrl(UPLOAD_KEY, 60);
        console.log('URL para download (válida por 60 segundos):', downloadUrl);
        console.log('----------------------\n');

        // 6. Copiar arquivo
        console.log('6. Copiando arquivo...');
        const COPY_KEY = 'example/test-upload-copy.jpg';
        await s3Service.copyFile(UPLOAD_KEY, COPY_KEY);
        console.log(`Arquivo copiado de ${UPLOAD_KEY} para ${COPY_KEY}`);
        
        // Verificar se os metadados foram copiados
        const copyMetadata = await s3Service.getFileMetadata(COPY_KEY);
        console.log('Metadados do arquivo copiado:');
        if (copyMetadata.SupabaseMetadata) {
            console.log(' - URL:', copyMetadata.SupabaseMetadata.s3_url);
            console.log(' - Dados adicionais transferidos:', 
                copyMetadata.SupabaseMetadata.additional_data ? 'Sim' : 'Não');
        } else {
            console.log(' - Metadados do Supabase não encontrados');
        }
        console.log('----------------------\n');

        // 7. Limpar arquivos de teste (opcional - comentado)
        // console.log('7. Limpando arquivos de teste...');
        // await s3Service.deleteFile(UPLOAD_KEY);
        // await s3Service.deleteFile(COPY_KEY);
        // console.log('Arquivos removidos com sucesso.');
        // console.log('----------------------\n');

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