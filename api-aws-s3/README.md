# API AWS S3

API REST completa para interação com o Amazon S3, construída com Node.js e Express.

## Funcionalidades

- Upload de arquivos
- Download de arquivos
- Geração de URLs pré-assinadas para upload/download
- Listagem de arquivos
- Deleção de arquivos
- Cópia de arquivos
- Obtenção de metadados
- Documentação Swagger
- Logging completo
- Tratamento de erros
- Validação de tipos de arquivo
- Limite de tamanho de arquivo

## Requisitos

- Node.js 14+
- Conta AWS com acesso ao S3
- Bucket S3 já criado

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente copiando o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

4. Preencha as variáveis no arquivo `.env`:
```env
# Configurações do AWS S3
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=sua_regiao
AWS_S3_BUCKET_NAME=nome_do_bucket

# Configurações da API
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=5242880 # 5MB em bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
CORS_ORIGIN=*
```

## Uso

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

## Endpoints

A documentação completa da API está disponível em `/api-docs` quando a aplicação estiver rodando.

### Principais endpoints:

- `POST /api/s3/upload` - Upload de arquivo
- `POST /api/s3/upload-url` - Gerar URL pré-assinada para upload
- `GET /api/s3/download/:key` - Download de arquivo
- `GET /api/s3/download-url/:key` - Gerar URL pré-assinada para download
- `DELETE /api/s3/files/:key` - Deletar arquivo
- `GET /api/s3/files` - Listar arquivos
- `GET /api/s3/files/:key/metadata` - Obter metadados
- `POST /api/s3/files/copy` - Copiar arquivo

## Exemplos de Uso

### Upload de arquivo

```bash
curl -X POST -F "file=@/caminho/do/arquivo.jpg" http://localhost:3000/api/s3/upload
```

### Listar arquivos

```bash
curl http://localhost:3000/api/s3/files
```

### Download de arquivo

```bash
curl http://localhost:3000/api/s3/download/nome-do-arquivo.jpg > arquivo.jpg
```

## Segurança

- Use HTTPS em produção
- Configure o CORS_ORIGIN apropriadamente
- Mantenha suas credenciais AWS seguras
- Configure políticas IAM adequadas
- Monitore os logs

## Logs

Os logs são salvos em:

- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs

## Contribuição

1. Faça o fork do projeto
2. Crie sua feature branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Licença

MIT 