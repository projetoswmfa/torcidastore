# Usando Supabase Storage com a API 

Esta API pode ser configurada para usar o Supabase Storage em vez do AWS S3, proporcionando uma alternativa fácil e poderosa para armazenamento de arquivos.

## Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Um projeto criado no Supabase
3. Acesso à dashboard do projeto

## Configuração do Supabase Storage

1. Acesse a dashboard do seu projeto no Supabase
2. Navegue até a seção "Storage" no menu lateral
3. Crie um novo bucket clicando em "New Bucket"
4. Nomeie o bucket como "files" (ou outro nome de sua preferência)
5. Desmarque a opção "Public bucket" para manter os arquivos privados (recomendado)

## Configuração de Políticas de Acesso

Para garantir que os arquivos sejam acessíveis apenas para os usuários autorizados, adicione políticas de segurança:

1. Na seção "Storage", clique em "Policies"
2. Adicione políticas personalizadas para controlar o acesso aos arquivos 

Exemplo de política para permitir acesso somente aos arquivos do próprio usuário:
```sql
CREATE POLICY "Enable storage access for users based on user_id" ON "storage"."objects"
AS PERMISSIVE FOR ALL
TO public
USING (bucket_id = 'files' AND (SELECT auth.uid()::text )= (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'files' AND (SELECT auth.uid()::text) = (storage.foldername(name))[1])
```

## Configuração da API

1. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Configurações do Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Configurações do Supabase Storage
SUPABASE_URL=https://[SEU_ID_DO_PROJETO].supabase.co
SUPABASE_SERVICE_KEY=[SUA_SERVICE_ROLE_KEY]
SUPABASE_BUCKET=files

# Configurações de Upload
MAX_FILE_SIZE=10485760 # 10MB em bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

# Configurações de Log
LOG_LEVEL=info
LOG_DIR=logs
```

2. Substitua `[SEU_ID_DO_PROJETO]` e `[SUA_SERVICE_ROLE_KEY]` com as informações do seu projeto:
   - O URL do projeto pode ser encontrado na seção "Project Settings" > "API"
   - A service key pode ser encontrada na seção "Project Settings" > "API" > "Project API keys" > "service_role" (MANTENHA SEGURA!)

## Dependências

Instale as dependências necessárias:

```bash
npm install @supabase/supabase-js
```

## Uso da API

A API agora está configurada para usar o Supabase Storage. Os endpoints funcionam da mesma maneira que com o AWS S3:

- **POST /api/s3/upload**: Upload direto de arquivo
- **POST /api/s3/upload-url**: Gera URL pré-assinada para upload
- **GET /api/s3/download/:key**: Download de arquivo
- **GET /api/s3/files**: Lista arquivos no bucket

## Diferenças entre AWS S3 e Supabase Storage

Embora a API mantenha a mesma interface, existem algumas diferenças entre o AWS S3 e o Supabase Storage:

1. **URLs pré-assinadas**: O formato e a duração podem variar
2. **Metadados**: O Supabase Storage tem um conjunto mais limitado de metadados disponíveis
3. **Estrutura de pastas**: O Supabase Storage utiliza uma estrutura de pastas virtual

## Migração de S3 para Supabase Storage

Para migrar arquivos existentes do AWS S3 para o Supabase Storage:

1. Baixe os arquivos do S3 usando a AWS CLI ou o console
2. Faça upload dos arquivos para o Supabase Storage usando a API ou o console
3. Verifique se todos os arquivos foram migrados corretamente

## Recomendações de Segurança

1. Nunca exponha a service key no frontend
2. Configure políticas de acesso adequadas
3. Implemente autenticação de usuários antes de permitir uploads
4. Limite os tipos de arquivo e tamanhos permitidos

## Solução de Problemas

Se encontrar problemas:

1. Verifique os logs da aplicação 
2. Consulte a documentação oficial do Supabase Storage: https://supabase.com/docs/guides/storage
3. Verifique as políticas de acesso no bucket 