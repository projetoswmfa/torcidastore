// Script para criar um novo usuário admin no Supabase usando chave de serviço
import { createClient } from '@supabase/supabase-js';

// Usar os mesmos valores da aplicação
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5Mjc0NSwiZXhwIjoyMDYwNjY4NzQ1fQ.jjCqwRJpxivMFU0Uu60-4-qaactZ6M81aUUuukC3PRM";

// Criar cliente com chave de serviço para poder gerenciar usuários
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente regular para testes
const regularSupabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y");

const NEW_USER_EMAIL = 'torcida.store@gmail.com';
const NEW_USER_PASSWORD = 'store@!';

async function createNewAdminUser() {
  console.log("Iniciando criação de novo usuário administrativo...");
  
  try {
    // 1. Criar novo usuário
    console.log(`Criando novo usuário com email: ${NEW_USER_EMAIL}`);
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: NEW_USER_EMAIL,
      password: NEW_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: 'Torcida Store Admin',
        full_name: 'Torcida Store Admin'
      }
    });
    
    if (createError) {
      console.error("ERRO AO CRIAR USUÁRIO:", createError);
      return;
    }
    
    console.log("Usuário criado com sucesso!");
    console.log("Detalhes do usuário:", {
      id: userData.user.id,
      email: userData.user.email,
      created_at: userData.user.created_at
    });
    
    // 2. Adicionar role de admin
    if (userData.user) {
      const userId = userData.user.id;
      console.log(`Adicionando role de admin para o usuário: ${userId}`);
      
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
    
    // 3. Verificar se consegue fazer login
    console.log("Testando login com as novas credenciais...");
    const { data: signInData, error: signInError } = await regularSupabase.auth.signInWithPassword({
      email: NEW_USER_EMAIL,
      password: NEW_USER_PASSWORD
    });
    
    if (signInError) {
      console.error("ERRO AO FAZER LOGIN DE TESTE:", signInError);
    } else {
      console.log("Login de teste bem-sucedido!");
      console.log("Dados da sessão:", {
        id: signInData.user.id,
        email: signInData.user.email,
        aud: signInData.user.aud
      });
      
      // Verificar permissões do usuário
      const { data: roleData, error: roleError } = await regularSupabase
        .from('user_roles')
        .select('*')
        .eq('user_id', signInData.user.id);
        
      if (roleError) {
        console.error("ERRO AO VERIFICAR ROLES:", roleError);
      } else {
        console.log("Roles do usuário:", roleData);
      }
      
      // Logout para encerrar o teste
      await regularSupabase.auth.signOut();
    }
    
    console.log("\n-----------------------------------------");
    console.log("NOVO USUÁRIO ADMIN CRIADO COM SUCESSO!");
    console.log("-----------------------------------------");
    console.log(`Email: ${NEW_USER_EMAIL}`);
    console.log(`Senha: ${NEW_USER_PASSWORD}`);
    console.log("-----------------------------------------");
    console.log("Este usuário possui permissões de administrador e");
    console.log("pode ser usado para acessar todas as funcionalidades");
    console.log("administrativas do sistema.");
    console.log("-----------------------------------------");
    
  } catch (err) {
    console.error("ERRO NA EXECUÇÃO:", err);
  }
}

// Executar a função
createNewAdminUser(); 