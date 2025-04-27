import { ChangeEvent, useState } from 'react';
import { useS3Upload } from '../../hooks/useS3Upload';
import { Button } from './button';
import { Loader2, Upload, Check, X, FileUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface S3ImageUploadProps {
  onSuccess?: (imageUrl: string) => void;
  className?: string;
  buttonText?: string;
}

export function S3ImageUpload({ 
  onSuccess, 
  className = '',
  buttonText = 'Selecionar Arquivo'
}: S3ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { uploading, error, uploadImage } = useS3Upload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpar estado anterior
    setSuccess(false);
    setUploadError(null);
    setSelectedFile(file);

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError("Tipo de arquivo inválido. Use apenas imagens JPG, PNG, WebP ou GIF.");
      toast.error("Tipo de arquivo inválido. Use apenas imagens JPG, PNG, WebP ou GIF.");
      return;
    }

    // Validar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Arquivo muito grande. O tamanho máximo é 5MB.");
      toast.error("Arquivo muito grande. O tamanho máximo é 5MB.");
      return;
    }

    // Gerar preview
    const filePreview = URL.createObjectURL(file);
    setPreview(filePreview);

    try {
      // Gerar um ID temporário para upload (será substituído pelo ID real do produto)
      const tempId = uuidv4();
      
      // Upload para S3
      const { imageUrl } = await uploadImage(file, tempId);
      
      if (!imageUrl) {
        throw new Error("URL da imagem não foi retornada pelo serviço S3");
      }
      
      // Callback de sucesso
      onSuccess?.(imageUrl);
      setSuccess(true);
      toast.success("Imagem enviada com sucesso!");
    } catch (err) {
      console.error('Erro no upload:', err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido no upload";
      setUploadError(errorMessage);
      toast.error(`Erro ao fazer upload da imagem: ${errorMessage}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="border-2 border-dashed border-[#E8F1F2] rounded-lg p-8 text-center hover:border-[#1B98E0]/50 transition-colors">
        {preview ? (
          <div className="relative mb-4">
            <img 
              src={preview} 
              alt="Preview da imagem" 
              className="max-h-48 mx-auto object-contain"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {success && (
              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <Check size={16} />
              </div>
            )}
          </div>
        ) : (
          <FileUp className="mx-auto h-12 w-12 text-[#006494]/40" />
        )}
        
        <div className="mt-2">
          <p className="text-sm text-[#13293D]/60">
            {selectedFile ? selectedFile.name : "Arraste e solte arquivos aqui ou clique para selecionar"}
          </p>
          {uploadError && (
            <p className="text-sm text-red-500 mt-1">{uploadError}</p>
          )}
        </div>
        
        <input 
          type="file" 
          id="s3-image-upload" 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        <Button 
          variant="outline" 
          className="mt-4 bg-[#E8F1F2] border-[#1B98E0]/30 text-[#006494] hover:bg-[#E8F1F2] hover:text-[#006494] hover:border-[#1B98E0]"
          onClick={() => document.getElementById('s3-image-upload')?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Imagem Enviada
            </>
          ) : (
            buttonText
          )}
        </Button>
      </div>
    </div>
  );
} 