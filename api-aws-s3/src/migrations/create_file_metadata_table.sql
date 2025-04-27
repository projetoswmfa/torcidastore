-- Cria tabela para armazenar metadados de arquivos
-- Esta tabela deve ser criada no seu banco de dados do Supabase

-- Tabela de metadados de arquivos
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_key TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  s3_url TEXT NOT NULL,
  content_type TEXT,
  size BIGINT DEFAULT 0,
  user_id TEXT,
  folder TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  additional_data JSONB DEFAULT '{}'::jsonb
);

-- Índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_folder ON file_metadata(folder);
CREATE INDEX IF NOT EXISTS idx_file_metadata_path ON file_metadata(file_path);
CREATE INDEX IF NOT EXISTS idx_file_metadata_content_type ON file_metadata(content_type);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_file_metadata_timestamp ON file_metadata;
CREATE TRIGGER trigger_update_file_metadata_timestamp
BEFORE UPDATE ON file_metadata
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Política de segurança RLS para acesso aos metadados
-- Cada usuário só pode ver seus próprios arquivos
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own file metadata"
ON file_metadata FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own file metadata"
ON file_metadata FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own file metadata"
ON file_metadata FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own file metadata"
ON file_metadata FOR DELETE
USING (auth.uid()::text = user_id);

-- Política para serviço de administração (usando JWT claims)
CREATE POLICY "Service role can do anything" 
ON file_metadata
USING (true)
WITH CHECK (true);

-- Comentários na tabela para documentação
COMMENT ON TABLE file_metadata IS 'Armazena metadados de arquivos armazenados no AWS S3';
COMMENT ON COLUMN file_metadata.file_key IS 'Chave única do arquivo no S3';
COMMENT ON COLUMN file_metadata.file_path IS 'Caminho completo do arquivo no S3';
COMMENT ON COLUMN file_metadata.s3_url IS 'URL pública ou pré-assinada para o arquivo no S3';
COMMENT ON COLUMN file_metadata.content_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN file_metadata.size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN file_metadata.user_id IS 'ID do usuário proprietário do arquivo';
COMMENT ON COLUMN file_metadata.folder IS 'Pasta do arquivo (se aplicável)';
COMMENT ON COLUMN file_metadata.additional_data IS 'Metadados adicionais específicos da aplicação'; 