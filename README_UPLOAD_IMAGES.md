# Upload de Imagens para AWS S3 - Documentação

Este documento descreve o fluxo de upload de imagens para produtos no Jersey League Shop, que utiliza AWS S3 para armazenamento e Supabase para metadados.

## Fluxo Implementado

O fluxo de upload de imagens foi otimizado para seguir as seguintes etapas:

1. **Seleção da Imagem**: Quando o usuário seleciona uma imagem usando o componente `S3ImageUpload`, a imagem é imediatamente enviada para o AWS S3.

2. **Upload para AWS S3**: O upload é realizado antes mesmo de o produto ser salvo no banco de dados, usando o hook `useS3Upload`.

3. **Obtenção da URL**: Após o upload bem-sucedido, a URL da imagem é salva no estado do produto que está sendo criado.

4. **Salvar Produto**: Quando o usuário clica em "Salvar Produto", o formulário já contém a URL da imagem no campo `image_url`.

5. **Registro de Metadados**: Após o produto ser salvo, os metadados da imagem são registrados na tabela `image_metadata` do Supabase.

## Componentes Principais

### S3ImageUpload

Um componente reutilizável criado para gerenciar o upload de imagens para AWS S3:

```tsx
<S3ImageUpload 
  onSuccess={(imageUrl) => {
    // Aqui a URL já está disponível, antes mesmo de salvar o produto
    setNewProduct(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  }}
/>
```

### useS3Upload

Um hook personalizado que encapsula a lógica de upload de imagens para o AWS S3:

```tsx
const { uploadImage } = useS3Upload();

// Fazer upload para o AWS S3 utilizando o hook
const { imageUrl, key } = await uploadImage(file, productId);
```

### AWS S3 Client

A integração com AWS S3 é gerenciada pelo módulo `s3client.ts`, que fornece funções para upload direto e gerenciamento de URLs:

```typescript
// src/integrations/aws/s3client.ts
export async function uploadFileToS3(file: File): Promise<{ key: string; url: string }> { ... }
```

## Vantagens da Abordagem

1. **Melhor experiência do usuário**: O usuário vê imediatamente a prévia da imagem e recebe feedback do processo de upload.

2. **Separação de responsabilidades**: O upload da imagem é independente da criação do produto, o que torna o código mais robusto.

3. **Tratamento de erros**: Erros no upload de imagens não impedem a criação do produto, e vice-versa.

4. **Performance**: O upload da imagem acontece em paralelo com o preenchimento do formulário, economizando tempo.

## Tabelas do Supabase

- **products**: Contém o campo `image_url` que armazena a URL completa da imagem no AWS S3.
- **image_metadata**: Armazena metadados adicionais sobre a imagem, incluindo o campo `storage_path` que também contém a URL.

## Configuração Necessária

Para que o sistema funcione corretamente, certifique-se de que:

1. O servidor API AWS S3 está em execução.
2. As variáveis de ambiente estão configuradas corretamente:
   - `VITE_AWS_S3_API_URL`: URL para a API intermediária (geralmente `http://localhost:3000/api/s3`)
   - `VITE_AWS_S3_BUCKET_NAME`: Nome do bucket S3 (ex: `torcidastore`)
   - `VITE_AWS_REGION`: Região do AWS S3 (ex: `sa-east-1`)

3. O bucket S3 está configurado para acesso público (para visualização das imagens).

## Solução de Problemas

Se as imagens não aparecerem corretamente:

1. Verifique se o servidor da API AWS S3 está rodando (`cd api-aws-s3 && npm start`).
2. Confirme que o bucket S3 tem as permissões corretas para acesso público.
3. Verifique os logs do console para erros durante o upload da imagem.
4. Teste a URL da imagem diretamente no navegador para confirmar o acesso.

---

A implementação atual garante que quando você clica em "Selecionar Arquivo" para adicionar um novo produto:

1. A imagem é imediatamente enviada para AWS S3
2. A URL gerada é obtida e armazenada no estado do produto
3. Quando o produto é salvo, a URL da imagem já está configurada para visualização 