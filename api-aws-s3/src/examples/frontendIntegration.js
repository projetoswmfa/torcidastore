/**
 * Exemplo de integração do Supabase Storage com um frontend em React
 * 
 * Este é um trecho de código que demonstra como implementar upload de arquivos
 * utilizando o Supabase Storage diretamente de um frontend React.
 * 
 * IMPORTANTE: Esta não é uma aplicação completa, apenas trechos de código para ilustrar a integração.
 */

/*
 * Exemplo de componente React para upload de imagens de produto
 */

/*
// Arquivo: components/ProductImageUpload.jsx

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const ProductImageUpload = ({ productId, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event) => {
    try {
      setError(null);
      setUploading(true);
      
      const file = event.target.files[0];
      
      if (!file) return;
      
      // Verificar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido. Use JPG, PNG ou WebP.');
        setUploading(false);
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Arquivo muito grande. O tamanho máximo é 2MB.');
        setUploading(false);
        return;
      }
      
      // Gerar nome de arquivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${uuidv4()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      // Upload para o Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
        
      // Callback com sucesso e dados da imagem
      onSuccess({
        path: filePath,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type
      });
      
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Falha ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="image-upload-container">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      
      {uploading && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ProductImageUpload;
*/

/*
 * Exemplo de configuração do cliente Supabase no frontend
 */

/*
// Arquivo: lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
*/

/*
 * Exemplo de hook personalizado para gerenciar uploads
 */

/*
// Arquivo: hooks/useImageUpload.js

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export function useImageUpload(bucketName = 'products', folder = '') {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const uploadImage = async (file, options = {}) => {
    try {
      if (!file) throw new Error('Nenhum arquivo fornecido');
      
      setUploading(true);
      setError(null);
      setProgress(0);
      
      // Validações
      const fileSize = file.size;
      const fileType = file.type;
      
      const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
      
      if (!allowedTypes.includes(fileType)) {
        throw new Error('Tipo de arquivo não permitido');
      }
      
      if (fileSize > maxSize) {
        throw new Error(`Arquivo muito grande. Máximo: ${Math.round(maxSize/1024/1024)}MB`);
      }
      
      // Nome do arquivo
      const fileExt = file.name.split('.').pop();
      const uuid = uuidv4();
      const fileName = options.fileName || `${uuid}.${fileExt}`;
      
      // Caminho completo
      const userId = options.userId || 'anonymous';
      const filePath = folder 
        ? `${userId}/${folder}/${fileName}`
        : `${userId}/${fileName}`;
      
      // Upload
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert || false,
          contentType: fileType,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percent);
          }
        });
        
      if (uploadError) throw uploadError;
      
      // URL pública
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      return {
        path: filePath,
        url: urlData.publicUrl,
        bucket: bucketName,
        name: fileName,
        size: fileSize,
        type: fileType
      };
      
    } catch (err) {
      setError(err.message || 'Erro ao fazer upload');
      throw err;
    } finally {
      setUploading(false);
    }
  };
  
  return {
    uploadImage,
    uploading,
    progress,
    error
  };
}
*/

/*
 * Exemplo de uso do hook personalizado em um componente
 */

/*
// Arquivo: components/ProfilePictureUpload.jsx

import React from 'react';
import { useImageUpload } from '../hooks/useImageUpload';
import { useAuth } from '../hooks/useAuth';

const ProfilePictureUpload = () => {
  const { user } = useAuth();
  const { uploadImage, uploading, progress, error } = useImageUpload('avatars');
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const result = await uploadImage(file, {
        userId: user.id,
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png'],
        fileName: `profile-${Date.now()}.${file.name.split('.').pop()}`
      });
      
      console.log('Upload concluído:', result);
      
      // Atualizar o perfil do usuário com a nova imagem
      // updateUserProfile(result.url); 
      
    } catch (err) {
      console.error('Falha no upload:', err);
    }
  };
  
  return (
    <div className="profile-upload">
      <label htmlFor="profile-pic">
        Alterar foto de perfil
        <input
          id="profile-pic"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
      
      {uploading && <progress value={progress} max="100" />}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ProfilePictureUpload;
*/ 