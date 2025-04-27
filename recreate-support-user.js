// Script para recriar o usuário de suporte no Supabase
import { createClient } from '@supabase/supabase-js';

// Usar os mesmos valores da aplicação
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5Mjc0NSwiZXhwIjoyMDYwNjY4NzQ1fQ.-jWFQSjXRigHxJJslvKB1A57q_8yDGz1M5GzMgDSu0U";

// Criar cliente com chave de serviço para poder gerenciar usuários
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente regular para testes
const regularSupabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y");

const USER_EMAIL = 'suporte@suporte.com';
const USER_PASSWORD = 'Store123';

async function recreateSupportUser() {
  console.log("Iniciando recriação do usuário de suporte...");
  
  try {
    // 1. Deletar usuário existente se houver
    console.log(`Verificando usuário existente com email: ${USER_EMAIL}`);
    
    // 2. Criar novo usuário
    console.log(`Criando novo usuário com email: ${USER_EMAIL}`);
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: USER_EMAIL,
      password: USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: 'Usuário de Suporte',
        full_name: 'Usuário de Suporte'
      }
    });
    
    if (createError) {
      console.error("ERRO AO CRIAR USUÁRIO:", createError);
      return;
    }
    
    console.log("Usuário criado com sucesso:", userData.user);
    
    // 3. Adicionar role de admin
    if (userData.user) {
      const userId = userData.user.id;
      console.log(`Adicionando role de admin para o usuário: ${userId}`);
      
      const { error: roleError } = await regularSupabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleError) {
        console.error("ERRO AO LIMPAR ROLES:", roleError);
      }
      
      const { error: insertError } = await regularSupabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: 'admin' }
        ]);
      
      if (insertError) {
        console.error("ERRO AO ADICIONAR ROLE DE ADMIN:", insertError);
      } else {
        console.log("Role de admin adicionada com sucesso!");
      }
    }
    
    // 4. Verificar se consegue fazer login
    console.log("Testando login com as novas credenciais...");
    const { data: signInData, error: signInError } = await regularSupabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    
    if (signInError) {
      console.error("ERRO AO FAZER LOGIN DE TESTE:", signInError);
    } else {
      console.log("Login de teste bem-sucedido!", signInData.user);
    }
    
    console.log("\n-----------------------------------------");
    console.log("INSTRUÇÕES DE LOGIN:");
    console.log(`Email: ${USER_EMAIL}`);
    console.log(`Senha: ${USER_PASSWORD}`);
    console.log("-----------------------------------------\n");
    
  } catch (err) {
    console.error("ERRO NA EXECUÇÃO:", err);
  }
}

// Executar a função
recreateSupportUser(); 