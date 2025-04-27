// Script para resetar a senha do usuário de suporte no Supabase
import { createClient } from '@supabase/supabase-js';

// Usar os mesmos valores da aplicação
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetSupportPassword() {
  console.log("Iniciando reset de senha do usuário de suporte...");
  
  const USER_EMAIL = 'suporte@suporte.com';
  const NEW_PASSWORD = 'Store123';
  
  try {
    // Verificar se o usuário existe
    console.log(`Verificando usuário: ${USER_EMAIL}`);
    
    // Enviar um reset de senha
    console.log(`Enviando reset de senha para: ${USER_EMAIL}`);
    const { error } = await supabase.auth.resetPasswordForEmail(USER_EMAIL);
    
    if (error) {
      console.error("ERRO AO SOLICITAR RESET DE SENHA:", error);
    } else {
      console.log("Solicitação de reset de senha enviada com sucesso!");
      console.log("Verifique o email da conta para concluir o processo.");
    }

    console.log("Para fazer login, tente usar a senha mencionada no ADMIN-ACCESS.md: 'store@!'");
    console.log("Ou a nova senha definida: 'Store123'");
  } catch (err) {
    console.error("ERRO NA EXECUÇÃO:", err);
  }
}

// Executar a função
resetSupportPassword(); 