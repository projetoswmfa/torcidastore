import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';

interface ImageDebugProps {
  imageUrl: string;
  className?: string;
}

export function ImageDebug({ imageUrl, className = '' }: ImageDebugProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [corsInfo, setCorsInfo] = useState<string>('Verificando...');
  const [altUrl, setAltUrl] = useState<string>('');
  
  const bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME || 'torcidastore';
  const region = import.meta.env.VITE_AWS_REGION || 'sa-east-1';
  
  useEffect(() => {
    async function checkImage() {
      setStatus('loading');
      
      try {
        // Tentar carregar a imagem usando fetch
        const response = await fetch(imageUrl, { method: 'HEAD' });
        
        if (response.ok) {
          setStatus('success');
          
          // Verificar CORS
          const corsHeaders = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods'
          ];
          
          let corsMessage = '';
          corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            corsMessage += `${header}: ${value || 'Não encontrado'}\n`;
          });
          
          setCorsInfo(corsMessage || 'Sem informações CORS');
          
        } else {
          setStatus('error');
          setCorsInfo(`Erro HTTP: ${response.status} ${response.statusText}`);
          
          // Gerar URL alternativa
          if (imageUrl.includes('/')) {
            const pathParts = imageUrl.split('/');
            const key = pathParts.slice(pathParts.indexOf(bucketName) + 1).join('/');
            const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
            setAltUrl(s3Url);
          }
        }
      } catch (error) {
        setStatus('error');
        setCorsInfo(`Erro: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (imageUrl) {
      checkImage();
    }
  }, [imageUrl, bucketName, region]);
  
  const tryAlternativeUrl = () => {
    if (altUrl) {
      window.open(altUrl, '_blank');
    }
  };
  
  const fixCors = async () => {
    try {
      const response = await fetch('/api/s3/fix-cors', { method: 'POST' });
      const result = await response.json();
      alert(`Tentativa de corrigir CORS: ${result.success ? 'Sucesso' : 'Falha'}`);
    } catch (error) {
      alert(`Erro ao tentar corrigir CORS: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="font-bold mb-2">Depuração de Imagem</h3>
      
      <div className="space-y-2 mb-4">
        <div>
          <strong>URL:</strong> <span className="text-xs break-all">{imageUrl}</span>
        </div>
        
        <div>
          <strong>Status:</strong>{' '}
          {status === 'loading' && <span className="text-yellow-500">Carregando...</span>}
          {status === 'success' && <span className="text-green-500">Acessível ✓</span>}
          {status === 'error' && <span className="text-red-500">Erro ✗</span>}
        </div>
        
        <div>
          <strong>Info CORS:</strong>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">{corsInfo}</pre>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {status === 'error' && altUrl && (
          <Button size="sm" onClick={tryAlternativeUrl}>
            Testar URL Alternativa
          </Button>
        )}
        
        <Button size="sm" variant="outline" onClick={fixCors}>
          Tentar Corrigir CORS
        </Button>
      </div>
      
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Prévia da Imagem:</h4>
        <img 
          src={imageUrl} 
          alt="Prévia"
          className="max-h-32 object-contain border rounded p-1"
          onError={(e) => console.error('Erro ao carregar imagem:', e)}
        />
      </div>
    </Card>
  );
} 