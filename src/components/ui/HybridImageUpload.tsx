import { ChangeEvent, useState } from 'react';
import { useHybridS3Upload } from '../../hooks/useHybridS3Upload';
import { Button } from './button';
import { Loader2, Upload, Check, X, AlertTriangle, Trash2, Link, FileUp } from 'lucide-react';
import { Input } from './input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { toast } from 'sonner';

interface HybridImageUploadProps {
  productId?: string;
  userId?: string;
  folder?: string;
  onSuccess?: (imageUrl: string, key: string) => void;
  onDelete?: () => void;
  tags?: string[];
  description?: string;
  initialImageUrl?: string;
  className?: string;
}

export function HybridImageUpload({
  productId,
  userId,
  folder = 'products',
  onSuccess,
  onDelete,
  tags = [],
  description,
  initialImageUrl,
  className = ''
}: HybridImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [success, setSuccess] = useState(Boolean(initialImageUrl));
  const { uploading, error, uploadImage, deleteImage, updateProductImageUrl } = useHybridS3Upload();
  
  // Estados para URL direta
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gerar preview
    const filePreview = URL.createObjectURL(file);
    setPreview(filePreview);
    setSuccess(false);

    try {
      // Upload para S3 com metadados
      const { imageUrl, key } = await uploadImage(file, {
        folder,
        productId,
        userId,
        tags,
        description: description || file.name
      });
      
      // Armazenar a chave para possível exclusão posterior
      setFileKey(key);
      
      // Atualiza o registro no Supabase se tivermos um productId
      if (productId) {
        await updateProductImageUrl(productId, imageUrl);
      }
      
      // Callback de sucesso
      onSuccess?.(imageUrl, key);
      setSuccess(true);
      toast.success("Imagem enviada com sucesso!");
    } catch (err) {
      console.error('Erro no upload:', err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido no upload";
      setUploadError(errorMessage);
      toast.error(`Erro ao fazer upload da imagem: ${errorMessage}`);
    }
  };

  const handleDelete = async () => {
    if (!fileKey) return;
    
    try {
      const deleted = await deleteImage(fileKey);
      if (deleted) {
        setPreview(null);
        setFileKey(null);
        setSuccess(false);
        onDelete?.();
        toast.success("Imagem removida com sucesso");
      }
    } catch (err) {
      console.error('Erro ao excluir arquivo:', err);
      toast.error("Erro ao excluir arquivo");
    }
  };
  
  // Função para usar uma URL direta
  const handleUseImageUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error("Por favor, insira uma URL de imagem");
      return;
    }
    
    // Validar se a URL parece ser uma imagem
    if (!imageUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      toast.error("A URL deve apontar para uma imagem (jpeg, jpg, gif, png, webp)");
      return;
    }
    
    setIsValidatingUrl(true);
    setSuccess(false);
    setUploadError(null);
    
    try {
      // Verificar se a imagem é carregável
      const img = new Image();
      img.onload = () => {
        // A imagem carregou com sucesso
        setPreview(imageUrl);
        
        // Gerar uma chave fictícia para o link externo
        const key = `external/${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        setFileKey(key);
        
        // Atualiza o registro no Supabase se tivermos um productId
        if (productId) {
          updateProductImageUrl(productId, imageUrl)
            .then(() => {
              console.log("URL da imagem atualizada no banco de dados");
            })
            .catch(err => {
              console.error("Erro ao atualizar URL da imagem:", err);
            });
        }
        
        // Callback de sucesso com a URL e a chave fictícia
        onSuccess?.(imageUrl, key);
        setSuccess(true);
        setIsValidatingUrl(false);
        toast.success("Link de imagem adicionado com sucesso!");
      };
      
      img.onerror = () => {
        // A imagem falhou ao carregar
        setIsValidatingUrl(false);
        setUploadError("Não foi possível carregar a imagem. Verifique se a URL está correta.");
        toast.error("Não foi possível carregar a imagem. Verifique se a URL está correta.");
      };
      
      // Iniciar o carregamento
      img.src = imageUrl;
    } catch (err) {
      setIsValidatingUrl(false);
      console.error('Erro ao validar URL:', err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao validar URL";
      setUploadError(errorMessage);
      toast.error(`Erro ao validar URL: ${errorMessage}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="mb-4 border rounded-md p-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
            <TabsTrigger value="url">URL da Imagem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <div className="flex flex-col items-center justify-center">
              {preview ? (
                <div className="relative w-full">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-auto max-h-64 object-contain rounded-md" 
                  />
                  {success && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <Check size={16} />
                    </div>
                  )}
                  
                  {/* Botão de exclusão no canto inferior direito quando há uma imagem */}
                  {fileKey && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute bottom-2 right-2"
                      onClick={handleDelete}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border-dashed border-2 border-gray-300 p-12 text-center rounded-md w-full">
                  <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Clique para fazer upload de uma imagem
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-2 text-red-500 flex items-center text-sm">
                  <AlertTriangle size={16} className="mr-1" />
                  {error.message}
                </div>
              )}

              <div className="mt-4 w-full">
                <label>
                  <Button 
                    type="button" 
                    variant={success ? "outline" : "default"}
                    className="w-full relative" 
                    disabled={uploading}
                  >
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {success 
                      ? 'Imagem enviada com sucesso' 
                      : preview 
                        ? 'Alterar imagem' 
                        : 'Selecionar imagem'
                    }
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </Button>
                </label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="url">
            <div className="border-2 border-[#E8F1F2] rounded-lg p-6 text-center">
              {preview ? (
                <div className="relative mb-4">
                  <img 
                    src={preview} 
                    alt="Preview da imagem" 
                    className="w-full h-auto max-h-64 object-contain rounded-md"
                  />
                  {isValidatingUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  {success && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <Check size={16} />
                    </div>
                  )}
                  
                  {/* Botão de exclusão quando há uma imagem */}
                  {fileKey && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute bottom-2 right-2"
                      onClick={handleDelete}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <Link className="mx-auto h-12 w-12 text-[#006494]/40" />
                  <p className="mt-2 text-sm text-gray-500">
                    Insira a URL de uma imagem
                  </p>
                </div>
              )}
              
              <div className="mt-4 space-y-4">
                <div className="flex flex-col space-y-2">
                  <Input
                    type="url"
                    placeholder="Cole a URL da imagem aqui (https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="border-[#1B98E0]/30"
                  />
                  <p className="text-xs text-[#13293D]/60 text-left">
                    Cole uma URL direta para uma imagem (ex: https://exemplo.com/imagem.jpg)
                  </p>
                </div>
                
                {uploadError && (
                  <p className="text-sm text-red-500 mt-1">{uploadError}</p>
                )}
                
                <Button 
                  variant="outline"
                  type="button"
                  className="w-full bg-[#E8F1F2] border-[#1B98E0]/30 text-[#006494] hover:bg-[#E8F1F2] hover:text-[#006494] hover:border-[#1B98E0]"
                  onClick={handleUseImageUrl}
                  disabled={isValidatingUrl || !imageUrl.trim()}
                >
                  {isValidatingUrl ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validando...
                    </>
                  ) : success ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Link Adicionado
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Usar esta URL
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 