# API AWS S3 para Jersey League Shop

Esta API fornece endpoints para upload de imagens para a Amazon S3, permitindo o armazenamento eficiente de imagens de produtos para o e-commerce Jersey League Shop.

## Configuração

1. Crie um arquivo `.env` na raiz do projeto baseado no modelo `.env.example`
2. Preencha as variáveis de ambiente:
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
   
   # Configurações de Upload
   MAX_FILE_SIZE=10485760 # 10MB em bytes
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
   
   # Configurações de Log
   LOG_LEVEL=info
   LOG_DIR=logs
   ```

## Criação e Configuração do Bucket S3

1. Acesse o console da AWS e navegue até o serviço S3
2. Clique em "Criar bucket"
3. Escolha um nome único para o bucket (anote-o para usar no .env)
4. Selecione a região desejada (anote-a para usar no .env)
5. Configurações recomendadas para um bucket de imagens públicas:
   - Desabilite "Bloquear todo o acesso público" (para permitir acesso às imagens)
   - Habilite versionamento (opcional)
   - Habilite a criptografia padrão

## Políticas de Acesso

Para permitir acesso público às imagens, adicione a seguinte política ao bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::seu-bucket-s3/*"
        }
    ]
}
```

Substitua `seu-bucket-s3` pelo nome do seu bucket.

## Criação de usuário IAM

1. Acesse o console da AWS e navegue até o serviço IAM
2. Crie um novo usuário com acesso programático
3. Anexe a política `AmazonS3FullAccess` ou crie uma política personalizada mais restritiva
4. Anote a Access Key e Secret Key geradas para usar no .env

## Executando a API

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000` (ou na porta definida no .env).

## Endpoints

- **POST /api/s3/upload**: Upload direto de arquivo
- **POST /api/s3/upload-url**: Gera URL pré-assinada para upload
- **GET /api/s3/download/:key**: Download de arquivo
- **GET /api/s3/files**: Lista arquivos no bucket

## Integração com o Frontend

O frontend pode usar o componente `ImageUpload` e o hook `useS3Upload` para facilitar a integração. 