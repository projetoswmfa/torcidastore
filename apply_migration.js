// Script para aplicar a migração do site_images
// Para executar: node apply_migration.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obter o diretório atual do arquivo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5Mjc0NSwiZXhwIjoyMDYwNjY4NzQ1fQ.-jWFQSjXRigHxJJslvKB1A57q_8yDGz1M5GzMgDSu0U";

// Criar cliente Supabase com permissões de serviço (para verificações)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Caminho para o arquivo de migração
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250428200108_create_site_images_table.sql');

async function checkIfTableExists() {
  try {
    const { data, error } = await supabase
      .from('site_images')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('A tabela site_images já existe!');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('A tabela site_images não existe ou há um erro:', error);
    return false;
  }
}

// Como a API do Supabase não permite executar SQL diretamente via client SDK,
// esta função cria dados simples para teste
async function createSampleData() {
  try {
    console.log('Criando dados de exemplo...');
    
    // Verifica se a tabela existe
    const tableExists = await checkIfTableExists();
    
    if (tableExists) {
      console.log('A tabela site_images já existe, criando um registro de teste...');
      
      // Inserir um registro de teste
      const { data, error } = await supabase
        .from('site_images')
        .insert({
          type: 'banner',
          image_path: 'test-banner.jpg',
          title: 'Banner de Teste',
          description: 'Este é um banner de teste',
          active: true,
          order_position: 1
        })
        .select();
      
      if (error) {
        console.error('Erro ao inserir dados de teste:', error);
      } else {
        console.log('Dados de teste inseridos com sucesso:', data);
      }
    } else {
      console.log('A tabela ainda não existe. Por favor, crie a tabela via painel do Supabase.');
      console.log('Abra o SQL Editor no Supabase e execute o seguinte SQL:');
      
      // Exibir o SQL para o usuário copiar e executar no painel do Supabase
      const sql = fs.readFileSync(migrationPath, 'utf8');
      console.log('\n--- COPIE E EXECUTE ESTE SQL NO EDITOR DO SUPABASE ---\n');
      console.log(sql);
      console.log('\n--- FIM DO SQL ---\n');
    }
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error);
  }
}

createSampleData(); 