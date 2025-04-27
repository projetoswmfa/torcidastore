// Script para criar um novo usuário admin no Supabase
import { createClient } from '@supabase/supabase-js';

// Usar os mesmos valores da aplicação
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createAdminUser() {
  console.log("Iniciando criação de usuário admin...");
  
  // Primeiro, vamos criar o usuário
  const email = 'admin@admin.com';
  const password = 'admin123';
  
  try {
    console.log(`Tentando criar usuário: ${email}`);
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Admin User',
        },
      },
    });

    if (signupError) {
      console.error("ERRO AO CRIAR USUÁRIO:", signupError);
      return;
    }

    console.log("Usuário criado com sucesso!");
    console.log("Dados do usuário:", signupData.user);
    
    // Agora vamos atribuir a função admin ao usuário
    if (signupData.user) {
      const userId = signupData.user.id;
      console.log(`Adicionando permissão de admin para o usuário ${userId}`);
      
      // Inserir na tabela user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: 'admin' }
        ]);
      
      if (roleError) {
        console.error("ERRO AO ADICIONAR PERMISSÃO ADMIN:", roleError);
      } else {
        console.log("Permissão admin adicionada com sucesso!");
      }
    }
  } catch (err) {
    console.error("ERRO NA EXECUÇÃO:", err);
  }
}

// Executar a função
createAdminUser(); 