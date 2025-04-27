# Configuração da Integração Jersey League Shop + AWS S3

Este documento explica como configurar e iniciar o Jersey League Shop com a integração AWS S3 para uploads de imagens.

## Arquitetura da Solução

O sistema consiste em dois componentes principais:

1. **Aplicação Frontend (React + Vite)** - Interface web principal do Jersey League Shop
2. **Servidor API AWS S3** - API responsável pela comunicação com o serviço Amazon S3

## Configuração

### 1. Configuração da API AWS S3

1. Navegue até a pasta `api-aws-s3`
2. Crie um arquivo `.env` com o seguinte conteúdo (substitua os valores conforme necessário):

```
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
```

3. Instale as dependências:

```bash
cd api-aws-s3
npm install
```

### 2. Configuração do Frontend

1. Na raiz do projeto, crie um arquivo `.env.local` com o seguinte conteúdo:

```
# Configurações da API AWS S3
VITE_AWS_S3_API_URL=http://localhost:3000/api/s3
VITE_AWS_S3_BUCKET_NAME=jersey-league-shop
VITE_AWS_REGION=us-east-1

# Configurações do Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
```

2. Instale as dependências do projeto principal:

```bash
npm install
```

## Iniciando o Projeto

### Iniciar Ambos os Serviços Automaticamente

Este projeto está configurado para iniciar tanto o frontend quanto o servidor AWS S3 com um único comando:

```bash
npm run start-all
```

Isso executará o script `start-servers.js` que irá:
- Verificar se os arquivos de configuração existem
- Iniciar o servidor API AWS S3
- Iniciar o servidor frontend Vite
- Mostrar os logs de ambos os serviços

### Iniciar Separadamente

Você também pode iniciar os serviços separadamente:

1. Iniciar o servidor AWS S3:
```bash
cd api-aws-s3
npm run dev
```

2. Iniciar o frontend:
```bash
npm run vite
```

## Uso em Produção

Para produção, siga estas etapas:

1. **Criar o build do frontend**:
```bash
npm run build
```

2. **Configurar um serviço permanente para a API AWS S3** usando PM2, Docker ou serviço de hospedagem apropriado.

3. **Atualizar as variáveis de ambiente** para apontar para as URLs de produção.

## Resolução de Problemas

### Problemas com Upload de Imagens

Se encontrar problemas com o upload de imagens:

1. Verifique se o servidor API AWS S3 está rodando
2. Verifique o console do navegador para erros
3. Verifique os logs do servidor API AWS S3
4. Confirme que as credenciais AWS estão corretas
5. Verifique se o bucket S3 existe e está configurado com as permissões corretas

### Erros CORS

Se encontrar erros de CORS:

1. Verifique se a variável `CORS_ORIGIN` no arquivo `.env` da API está configurada corretamente
2. Confirme que o bucket S3 tem a política CORS configurada adequadamente

### Teste de Conexão

Para testar se a API S3 está funcionando:

1. Inicie o servidor API S3
2. Acesse `http://localhost:3000/api-docs` para ver a documentação da API
3. Teste a rota de upload usando o Swagger UI ou Postman

## Referências Adicionais

- [Documentação AWS S3](https://docs.aws.amazon.com/s3/)
- [Configuração de Bucket S3](https://docs.aws.amazon.com/s3/latest/userguide/creating-bucket.html)
- [Configuração de Políticas CORS para S3](https://docs.aws.amazon.com/s3/latest/userguide/enabling-cors-configuration.html) 