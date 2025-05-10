import { useState } from 'react';
import { useImageUrl } from '@/hooks/useImageUrl';

interface ImageUrlInputProps {
  onSuccess?: (imageUrl: string) => void;
  initialImageUrl?: string;
  className?: string;
  productId?: string;
}

export function ImageUrlInput({
  onSuccess,
  initialImageUrl = '',
  className = '',
  productId,
}: ImageUrlInputProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
  const [validating, setValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { loading, error, saveImageUrl, validateImageUrl } = useImageUrl();

  // Função para validar a URL da imagem
  const validateUrl = async () => {
    if (!imageUrl.trim()) {
      setValidationError('Digite uma URL de imagem');
      return false;
    }

    // Verificar se a URL parece ser válida
    if (!imageUrl.match(/^https?:\/\/.+/i)) {
      setValidationError('URL inválida. A URL deve começar com http:// ou https://');
      return false;
    }

    // Verificar se a URL parece ser uma imagem
    if (!imageUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
      setValidationError('A URL não aponta para uma imagem válida (deve terminar com .jpg, .png, etc)');
      return false;
    }

    setValidating(true);
    setValidationError(null);

    try {
      // Verificar se a imagem é acessível
      const result = await validateImageUrl(imageUrl);
      
      if (!result.valid) {
        setValidationError(result.message);
        return false;
      }
      
      return true;
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Erro ao validar URL da imagem');
      return false;
    } finally {
      setValidating(false);
    }
  };

  // Função para carregar a imagem no preview
  const loadPreview = () => {
    if (!imageUrl.trim()) {
      setValidationError('Digite uma URL de imagem');
      return;
    }

    setPreview(null);
    setValidationError(null);

    const img = new Image();
    img.onload = () => {
      setPreview(imageUrl);
      setValidationError(null);
    };

    img.onerror = () => {
      setValidationError('Não foi possível carregar a imagem. Verifique se a URL está correta.');
    };

    img.src = imageUrl;
  };

  // Função para usar a URL da imagem
  const handleUseImageUrl = async () => {
    // Validar a URL primeiro
    const isValid = await validateUrl();
    
    if (!isValid) {
      return;
    }

    try {
      // Registrar a URL e atualizar o produto se necessário
      await saveImageUrl(imageUrl, productId);
      
      // Atualizar o preview
      setPreview(imageUrl);
      
      // Chamar o callback de sucesso
      onSuccess?.(imageUrl);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Erro ao salvar URL da imagem');
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">URL da Imagem</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <button
            type="button"
            onClick={loadPreview}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
          >
            Visualizar
          </button>
        </div>
      </div>

      {validationError && (
        <div className="text-red-500 text-sm">{validationError}</div>
      )}

      {preview && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pré-visualização</p>
          <div className="relative w-full h-64 border rounded-md overflow-hidden bg-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="object-contain w-full h-full"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleUseImageUrl}
          disabled={validating || loading}
          className={`px-4 py-2 rounded-md text-sm text-white ${
            validating || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {validating || loading ? 'Processando...' : 'Usar esta imagem'}
        </button>
      </div>
    </div>
  );
} 