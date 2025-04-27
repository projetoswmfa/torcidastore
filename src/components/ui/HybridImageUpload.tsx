import { ChangeEvent, useState } from 'react';
import { useHybridS3Upload } from '../../hooks/useHybridS3Upload';
import { Button } from './button';
import { Loader2, Upload, Check, X, AlertTriangle, Trash2 } from 'lucide-react';

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
    } catch (err) {
      console.error('Erro no upload:', err);
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
      }
    } catch (err) {
      console.error('Erro ao excluir arquivo:', err);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="mb-4 border rounded-md p-6 flex flex-col items-center justify-center">
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
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
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
    </div>
  );
} 