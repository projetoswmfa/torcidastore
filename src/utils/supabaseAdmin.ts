import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica se um usuário existe no Supabase
 * @param email Email do usuário a ser verificado
 */
export async function checkUserExists(email: string) {
  try {
    console.log("Verificando se o usuário existe:", email);
    
    // Utilizando a função RPC personalizada no Supabase que retorna informações sobre o usuário
    const { data, error } = await supabase.rpc('check_user_status', { email });
    
    if (error) {
      console.error("Erro ao verificar usuário:", error);
      return { 
        success: false, 
        error, 
        exists: false 
      };
    }
    
    console.log("Resultado da verificação do usuário:", data);
    return { 
      success: true, 
      exists: data ? (data as any).exists || false : false,
      isConfirmed: data ? (data as any).confirmed || false : false,
      data
    };
  } catch (error) {
    console.error("Erro ao verificar existência do usuário:", error);
    return { success: false, error, exists: false };
  }
}

/**
 * Verifica se um usuário tem papel de administrador
 * @param userId ID do usuário a ser verificado
 */
export async function checkUserIsAdmin(userId: string) {
  try {
    console.log("Verificando se o usuário é admin:", userId);
    
    // Verificando a tabela user_roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');
    
    if (error) {
      console.error("Erro ao verificar papel de admin:", error);
      return { success: false, error, isAdmin: false };
    }
    
    const isAdmin = data && data.length > 0;
    console.log("Resultado da verificação de admin:", { isAdmin, data });
    
    return { success: true, isAdmin, data };
  } catch (error) {
    console.error("Erro ao verificar papel de administrador:", error);
    return { success: false, error, isAdmin: false };
  }
}

/**
 * Cria um novo usuário administrador (apenas para desenvolvimento)
 * @param email Email do novo admin
 * @param password Senha do novo admin
 */
export async function createAdminUser(email: string, password: string) {
  try {
    console.log("Criando novo usuário admin:", email);
    
    // 1. Criar o usuário
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (userError) {
      console.error("Erro ao criar usuário:", userError);
      return { success: false, error: userError };
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      console.error("Usuário criado mas ID não encontrado");
      return { success: false, error: new Error("ID do usuário não encontrado") };
    }
    
    console.log("Usuário criado com sucesso:", userId);
    
    // 2. Atribuir papel de admin ao usuário
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert([
        { user_id: userId, role: 'admin' }
      ]);
    
    if (roleError) {
      console.error("Erro ao atribuir papel de admin:", roleError);
      return { success: false, error: roleError, userId };
    }
    
    console.log("Papel de admin atribuído com sucesso");
    return { success: true, userId, userData };
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
    return { success: false, error };
  }
} 