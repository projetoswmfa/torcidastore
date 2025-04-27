// Script para redefinir o usuário de suporte no Supabase
import { createClient } from '@supabase/supabase-js';

// Usar os mesmos valores da aplicação
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y";

// Cliente regular para testes
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Credenciais de teste para diferentes usuários
const testCredentials = [
  { email: 'suporte@suporte.com', password: 'store@!' },  // Senha original conforme documentação
  { email: 'suporte@suporte.com', password: 'Store123' }, // Nova senha que tentamos definir
  { email: 'admin2@jersey.com', password: 'admin123' }    // Admin padrão conforme documentação
];

async function testLogins() {
  console.log("Iniciando testes de login com várias credenciais...");
  
  for (const creds of testCredentials) {
    try {
      console.log(`\nTestando login com: ${creds.email} / ${creds.password}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });
      
      if (error) {
        console.error(`ERRO AO FAZER LOGIN COM ${creds.email}:`, error);
      } else {
        console.log(`LOGIN BEM-SUCEDIDO com ${creds.email}!`);
        console.log("Dados do usuário:", {
          id: data.user.id,
          email: data.user.email,
          last_sign_in: data.user.last_sign_in_at,
        });
        
        // Fazer logout para testar próxima credencial
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error(`ERRO INESPERADO AO TESTAR ${creds.email}:`, err);
    }
  }
  
  console.log("\n-----------------------------------------");
  console.log("RESUMO DOS TESTES DE LOGIN:");
  console.log("-----------------------------------------");
  console.log("Para resolver o problema de login, tente:");
  console.log("1. Usar o usuário admin2@jersey.com com senha admin123");
  console.log("2. Se persistir o problema, pode ser necessário reiniciar o servidor do Supabase ou verificar as configurações de autenticação");
  console.log("-----------------------------------------");
}

// Executar a função
testLogins(); 