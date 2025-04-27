// Script para recriar o usuário admin no Supabase
import { createClient } from '@supabase/supabase-js';

// Usar os mesmos valores da aplicação
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function recreateAdminUser() {
  console.log("Criando novo usuário admin...");
  
  try {
    // Criar novo usuário admin
    const { data, error } = await supabase.auth.signUp({
      email: 'admin2@jersey.com', // Usando um email diferente para evitar conflito
      password: 'admin123',
      options: {
        data: {
          full_name: 'Admin User',
          is_admin: true
        }
      }
    });
    
    if (error) {
      console.error("ERRO AO CRIAR USUÁRIO:", error);
    } else {
      console.log("Usuário criado com sucesso!");
      console.log("ID do novo usuário:", data.user.id);
      
      // Adicionar permissão de admin
      console.log("Adicionando permissão admin...");
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: data.user.id, role: 'admin' }
        ]);
        
      if (roleError) {
        console.error("ERRO AO ADICIONAR PERMISSÃO ADMIN:", roleError);
      } else {
        console.log("Permissão admin adicionada com sucesso!");
      }
    }
  } catch (err) {
    console.error("ERRO NA CRIAÇÃO DO USUÁRIO:", err);
  }
}

recreateAdminUser(); 