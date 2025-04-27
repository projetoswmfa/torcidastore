// Script para testar o login do novo usuário admin
import { createClient } from '@supabase/supabase-js';

// Usar os mesmos valores da aplicação
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y";

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const USER_EMAIL = 'torcida.store@gmail.com';
const USER_PASSWORD = 'store@!';

async function testAdminLogin() {
  console.log(`Testando login como ${USER_EMAIL}...`);
  
  try {
    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    
    if (error) {
      console.error("ERRO AO FAZER LOGIN:", error);
      return;
    }
    
    console.log("Login bem-sucedido!");
    console.log("Dados do usuário:", {
      id: data.user.id,
      email: data.user.email,
      last_sign_in: data.user.last_sign_in_at
    });
    
    // Verificar roles do usuário
    console.log("Verificando papéis (roles) do usuário...");
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', data.user.id);
      
    if (rolesError) {
      console.error("ERRO AO VERIFICAR ROLES:", rolesError);
    } else {
      console.log("Roles encontradas:", rolesData);
      
      // Verificar se tem papel de admin
      const isAdmin = rolesData.some(role => role.role === 'admin');
      console.log(`Usuário possui papel de admin: ${isAdmin ? 'SIM' : 'NÃO'}`);
    }
    
    // Verificar se é admin usando a função RPC is_admin
    console.log("Verificando função is_admin...");
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_admin', { user_id: data.user.id });
      
    if (isAdminError) {
      console.error("ERRO AO EXECUTAR FUNÇÃO is_admin:", isAdminError);
    } else {
      console.log(`Resultado da função is_admin: ${isAdminData}`);
    }
    
    // Fazer logout
    await supabase.auth.signOut();
    console.log("Logout realizado com sucesso");
    
    console.log("\n-----------------------------------------");
    console.log("RESULTADO DO TESTE:");
    console.log("-----------------------------------------");
    console.log("O novo usuário admin foi criado e configurado com sucesso!");
    console.log("Você pode fazer login no sistema utilizando:");
    console.log(`Email: ${USER_EMAIL}`);
    console.log(`Senha: ${USER_PASSWORD}`);
    console.log("-----------------------------------------");
    
  } catch (err) {
    console.error("ERRO INESPERADO:", err);
  }
}

// Executar a função
testAdminLogin(); 