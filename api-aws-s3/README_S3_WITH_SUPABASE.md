# Armazenamento de Arquivos com AWS S3 + Metadados no Supabase

Esta API proporciona uma solução híbrida para gerenciamento de arquivos, combinando o robusto armazenamento do AWS S3 com a flexibilidade do banco de dados Supabase para metadados.

## Visão Geral da Arquitetura

- **AWS S3**: Armazena fisicamente todos os arquivos
- **Supabase**: Armazena apenas metadados e referências para os arquivos
- **API**: Gerencia as operações de upload, download e metadados

Esta abordagem permite economizar espaço no Supabase enquanto mantém a possibilidade de consultas avançadas nos metadados dos arquivos.

## Pré-requisitos

1. Conta na AWS com acesso ao S3
2. Bucket S3 configurado
3. Conta no Supabase com acesso ao banco de dados
4. Tabela `file_metadata` criada no Supabase

## Configuração

### 1. Configuração do AWS S3

1. Crie um bucket S3 na AWS
2. Configure as permissões apropriadas
3. Obtenha as credenciais de acesso (Access Key e Secret Key)

### 2. Configuração do Supabase

1. Crie a tabela de metadados no Supabase executando o script SQL em `/src/migrations/create_file_metadata_table.sql`
2. Obtenha a URL e a chave de serviço do seu projeto Supabase

### 3. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Configurações do Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Configurações do AWS S3
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=seu-bucket-s3

# Configurações do Supabase (apenas para metadados)
SUPABASE_URL=https://[SEU_ID_DO_PROJETO].supabase.co
SUPABASE_SERVICE_KEY=[SUA_SERVICE_ROLE_KEY]

# Configurações de Upload
MAX_FILE_SIZE=10485760 # 10MB em bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

# Configurações de Log
LOG_LEVEL=info
LOG_DIR=logs
```

## Funcionalidades

### Armazenamento de Arquivos (AWS S3)

- Upload de arquivos para o S3
- Download de arquivos do S3
- Geração de URLs pré-assinadas para upload/download
- Listagem de arquivos em diretórios
- Cópia e exclusão de arquivos

### Metadados de Arquivos (Supabase)

- Armazenamento de metadados detalhados (tipo, tamanho, tags, etc.)
- Busca avançada por metadados
- Organização por usuário, pasta, tipo de conteúdo
- Metadados personalizáveis conforme necessidade da aplicação

## Vantagens desta Abordagem

1. **Economia de Recursos**: O Supabase armazena apenas metadados leves, enquanto o S3 lida com o armazenamento físico dos arquivos
2. **Escalabilidade**: O S3 é altamente escalável para armazenamento de arquivos
3. **Consultas Avançadas**: O PostgreSQL do Supabase permite consultas complexas nos metadados
4. **Segurança**: As políticas RLS do Supabase garantem acesso seguro aos metadados
5. **Separação de Responsabilidades**: Cada serviço faz o que melhor sabe fazer

## Uso da API

### Upload de Arquivo

```javascript
// Exemplo de upload de arquivo com metadados
const result = await s3Service.uploadFile(
  fileBuffer,               // Buffer do arquivo
  'user123/imagens/foto.jpg', // Caminho no S3
  'image/jpeg',             // Tipo MIME
  {                         // Metadados adicionais
    description: 'Foto de perfil',
    tags: ['perfil', 'usuário'],
    isPublic: true
  }
);

console.log('Arquivo enviado:', result.url);
```

### Busca por Metadados

```javascript
// Buscar por tipo de arquivo
const imageFiles = await s3Service.searchFilesByMetadata(
  { content_type: 'image/jpeg', user_id: 'user123' },
  { limit: 20, orderBy: 'created_at', ascending: false }
);

// Processar resultados
imageFiles.forEach(file => {
  console.log(`${file.file_key}: ${file.s3_url}`);
});
```

## Estrutura de Diretórios Recomendada

Recomendamos organizar os arquivos no S3 em uma estrutura hierárquica:

```
{user_id}/{categoria}/{nome_arquivo}
```

Por exemplo:
- `user123/imagens/perfil.jpg`
- `user456/documentos/contrato.pdf`

Isso facilita a separação de arquivos por usuário e categoria, além de melhorar a segurança.

## Considerações de Segurança

1. **Nunca expor as credenciais AWS**: Mantenha as chaves da AWS seguras no servidor
2. **Validar tipos de arquivo**: Sempre verifique o tipo MIME antes de permitir uploads
3. **Limitar tamanho de arquivo**: Defina limites claros para tamanhos de arquivos
4. **Políticas RLS no Supabase**: Garanta que usuários só acessem seus próprios metadados
5. **URLs pré-assinadas**: Use URLs com tempo limitado para arquivos privados

## Exemplos

Veja exemplos completos em:
- `/src/examples/s3WithSupabaseMetadataExample.js`

## Scripts Úteis

```bash
# Executar o exemplo de integração S3 + Supabase
npm run example:s3-supabase-metadata

# Testar conexão
npm run test:connection
```

## Solução de Problemas

### Problemas comuns:

1. **Erro de CORS**: Configure as regras CORS no bucket S3
2. **Falha ao salvar metadados**: Verifique se a tabela `file_metadata` existe no Supabase
3. **Erro de permissão**: Verifique as políticas RLS e permissões do bucket S3

## Conclusão

Esta abordagem híbrida combina o melhor dos dois serviços: o armazenamento robusto e escalável do AWS S3 com a flexibilidade e capacidade de consulta do banco de dados PostgreSQL do Supabase.

Ao armazenar apenas metadados no Supabase, você economiza no uso do armazenamento do Supabase e ainda mantém a capacidade de realizar consultas avançadas sobre seus arquivos. 