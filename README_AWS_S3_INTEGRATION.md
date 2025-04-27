# Integração AWS S3 para o Jersey League Shop

Este documento descreve a implementação da integração entre o Jersey League Shop e o Amazon S3 para armazenamento de imagens de produtos.

## Visão Geral

A implementação consiste em dois componentes principais:

1. **API AWS S3** - Um servidor Express que gerencia a comunicação com o serviço Amazon S3
2. **Frontend React** - Componentes e hooks para fazer upload de imagens e gerenciar a integração com o Supabase

## Arquitetura de Funcionamento

O fluxo de upload de imagens funciona da seguinte forma:

1. O usuário seleciona uma imagem no formulário de produto
2. O frontend envia a imagem para a API AWS S3 via HTTP POST
3. A API processa o upload para o bucket S3 e retorna a chave do arquivo e outras informações
4. O frontend recebe a URL da imagem no S3 e a salva no banco de dados Supabase
5. O produto é exibido com a imagem servida diretamente do S3

## Configuração da API AWS S3

A API está localizada na pasta `api-aws-s3` e precisa ser configurada conforme descrito em seu próprio README.

### Executando a API

1. Navegue até a pasta da API:
   ```bash
   cd api-aws-s3
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` baseado no arquivo `.env.example`

4. Inicie o servidor:
   ```bash
   npm run dev
   ```

## Componentes do Frontend

### Hook `useS3Upload`

Um hook personalizado que encapsula a lógica de upload de imagens para o S3 e atualização do Supabase.

**Uso básico:**

```tsx
import { useS3Upload } from '../hooks/useS3Upload';

function MyComponent() {
  const { uploading, error, uploadImage, updateProductImageUrl } = useS3Upload();
  
  const handleUpload = async (file: File, productId: string) => {
    try {
      const { imageUrl } = await uploadImage(file, productId);
      await updateProductImageUrl(productId, imageUrl);
      console.log('Upload concluído!');
    } catch (err) {
      console.error('Erro no upload:', err);
    }
  };
  
  return (
    <div>
      {uploading && <p>Enviando imagem...</p>}
      {error && <p>Erro: {error.message}</p>}
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file, 'produto-123');
      }} />
    </div>
  );
}
```

### Componente `ImageUpload`

Um componente React reutilizável que fornece uma interface de usuário para upload de imagens.

**Uso básico:**

```tsx
import { ImageUpload } from '../components/ui/ImageUpload';

function ProductFormComponent() {
  const handleImageSuccess = (imageUrl: string) => {
    console.log('Imagem enviada:', imageUrl);
    // Atualizar estado local ou fazer outra ação
  };
  
  return (
    <div>
      <h2>Formulário de Produto</h2>
      {/* Outros campos do formulário */}
      
      <ImageUpload 
        productId="produto-123" 
        onSuccess={handleImageSuccess} 
      />
    </div>
  );
}
```

## Campos no Supabase

A tabela `products` deve conter um campo `image_url` para armazenar a URL completa da imagem no S3:

```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

## Considerações de Segurança

1. **Credenciais AWS**: Nunca exponha as credenciais AWS no frontend. Use sempre a API intermediária.
2. **Acesso Público**: As imagens de produtos são configuradas para acesso público. Certifique-se de que apenas dados não sensíveis sejam armazenados desta forma.
3. **Controle de Tamanho**: A API limita o tamanho dos arquivos enviados para evitar abusos.

## Resolução de Problemas

### CORS

Se encontrar erros de CORS:

1. Verifique se a variável de ambiente `CORS_ORIGIN` na API está configurada corretamente
2. Confirme que o bucket S3 tem a política CORS configurada adequadamente

### Imagens não aparecem

1. Verifique se o bucket S3 está configurado para acesso público
2. Confirme que a política de bucket permite a ação `s3:GetObject`
3. Verifique se a URL salva no Supabase está correta

### Uploads falham

1. Verifique os logs da API para erros específicos
2. Confirme que o tamanho do arquivo está dentro do limite configurado
3. Verifique se o tipo de arquivo está na lista de tipos permitidos 