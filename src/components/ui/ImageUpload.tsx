import { ChangeEvent, useState } from 'react';
import { useS3Upload } from '../../hooks/useS3Upload';
import { Button } from './button';
import { Loader2, Upload, Check, X } from 'lucide-react';

interface ImageUploadProps {
  productId: string;
  onSuccess?: (imageUrl: string) => void;
  className?: string;
}

export function ImageUpload({ productId, onSuccess, className = '' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { uploading, error, uploadImage, updateProductImageUrl } = useS3Upload();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gerar preview
    const filePreview = URL.createObjectURL(file);
    setPreview(filePreview);
    setSuccess(false);

    try {
      // Upload para S3
      const { imageUrl } = await uploadImage(file, productId);
      
      // Atualiza o registro no Supabase
      await updateProductImageUrl(productId, imageUrl);
      
      // Callback de sucesso
      onSuccess?.(imageUrl);
      setSuccess(true);
    } catch (err) {
      console.error('Erro no upload:', err);
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
            <X size={16} className="mr-1" />
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