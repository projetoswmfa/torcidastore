// Script para recriar o usuário admin torcida.store@gmail.com
import { createClient } from '@supabase/supabase-js';

// Configurações
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5Mjc0NSwiZXhwIjoyMDYwNjY4NzQ1fQ.jjCqwRJpxivMFU0Uu60-4-qaactZ6M81aUUuukC3PRM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y";

// Credenciais do usuário
const USER_EMAIL = 'torcida.store@gmail.com';
const USER_PASSWORD = 'store@!';

// Criar clientes Supabase
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const regularSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function recreateTorcidaAdmin() {
  console.log("=== RECRIAÇÃO DO USUÁRIO ADMIN TORCIDA STORE ===");
  
  try {
    // 1. Verificar se o usuário já existe
    console.log(`Verificando se o usuário ${USER_EMAIL} já existe...`);
    const { data: userData, error: userError } = await adminSupabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Erro ao listar usuários:", userError);
      return;
    }
    
    const existingUser = userData.users.find(u => u.email === USER_EMAIL);
    
    // 2. Se o usuário existir, podemos deletá-lo
    if (existingUser) {
      console.log(`O usuário ${USER_EMAIL} já existe. ID: ${existingUser.id}`);
      console.log("Deletando usuário existente...");
      
      const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(existingUser.id);
      
      if (deleteError) {
        console.error("Erro ao deletar usuário:", deleteError);
        return;
      }
      console.log("Usuário deletado com sucesso.");
    }
    
    // 3. Criar o usuário
    console.log(`Criando usuário ${USER_EMAIL}...`);
    const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: USER_EMAIL,
      password: USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: 'Torcida Store Admin',
        full_name: 'Torcida Store Admin'
      }
    });
    
    if (createError) {
      console.error("Erro ao criar usuário:", createError);
      return;
    }
    
    const newUserId = createData.user.id;
    console.log(`Usuário criado com sucesso. ID: ${newUserId}`);
    
    // 4. Adicionar papéis (roles)
    console.log("Adicionando papéis ao usuário...");
    
    // 4.1 Adicionar papel 'user'
    console.log("Adicionando papel 'user'...");
    const { error: userRoleError } = await regularSupabase
      .from('user_roles')
      .insert([{ user_id: newUserId, role: 'user' }]);
      
    if (userRoleError) {
      console.error("Erro ao adicionar papel 'user':", userRoleError);
    } else {
      console.log("Papel 'user' adicionado com sucesso.");
    }
    
    // 4.2 Adicionar papel 'admin' (usando SQL direto para garantir)
    console.log("Adicionando papel 'admin'...");
    const { error: adminRoleError } = await adminSupabase.rpc('exec_sql', {
      query: `
        INSERT INTO user_roles (user_id, role)
        VALUES ('${newUserId}', 'admin')
        ON CONFLICT (user_id, role) DO NOTHING
      `
    });
    
    if (adminRoleError) {
      console.error("Erro ao adicionar papel 'admin':", adminRoleError);
    } else {
      console.log("Papel 'admin' adicionado com sucesso.");
    }
    
    // 5. Verificar os papéis do usuário
    console.log("Verificando papéis do usuário...");
    
    const { data: rolesData, error: rolesError } = await regularSupabase
      .from('user_roles')
      .select('*')
      .eq('user_id', newUserId);
      
    if (rolesError) {
      console.error("Erro ao verificar papéis:", rolesError);
    } else {
      console.log("Papéis atuais do usuário:", rolesData);
    }
    
    // 6. Resumo
    console.log("\n=== RESUMO DA OPERAÇÃO ===");
    console.log(`Usuário ${USER_EMAIL} criado/recriado com sucesso.`);
    console.log(`ID: ${newUserId}`);
    console.log("Email: torcida.store@gmail.com");
    console.log("Senha: store@!");
    console.log("Papéis: user, admin");
    console.log("================================");
    
  } catch (err) {
    console.error("ERRO INESPERADO:", err);
  }
}

// Executar a função
recreateTorcidaAdmin(); 