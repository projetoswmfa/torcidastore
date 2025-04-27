import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface UserRolesState {
  roles: UserRole[];
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useUserRoles() {
  const { user, isAuthenticated } = useAuthContext();
  const [state, setState] = useState<UserRolesState>({
    roles: [],
    isAdmin: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUserRoles = async () => {
      if (!isAuthenticated || !user) {
        // Se não estiver autenticado, não há nada para buscar
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      console.log("useUserRoles - Buscando roles para o usuário:", user.id);
      try {
        // Método 1: Busca direta na tabela user_roles
        const { data: tableData, error: tableError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);
        
        if (tableError) {
          console.error("useUserRoles - Erro ao buscar roles da tabela:", tableError);
          throw tableError;
        }

        console.log("useUserRoles - Dados obtidos da tabela user_roles:", tableData);
        
        // Método 2: Uso da função RPC is_admin (função SQL no Supabase)
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('is_admin', { user_id: user.id });
        
        if (rpcError) {
          console.error("useUserRoles - Erro ao verificar admin via RPC:", rpcError);
          // Não lançamos erro aqui para tentar prosseguir com o método 1
        } else {
          console.log("useUserRoles - Resultado da função is_admin:", rpcData);
        }

        // Determina se é admin com base nos dois métodos
        // Prioriza o resultado da tabela, mas usa RPC como backup
        const isAdminFromTable = tableData && 
                               tableData.length > 0 && 
                               tableData.some(r => r.role === 'admin');

        const isAdmin = isAdminFromTable || (rpcData === true);
        
        if (isMounted) {
          setState({
            roles: tableData || [],
            isAdmin,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error("useUserRoles - Erro ao verificar roles:", error);
        if (isMounted) {
          setState({
            roles: [],
            isAdmin: false,
            isLoading: false,
            error: error as Error
          });
        }
      }
    };

    fetchUserRoles();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthenticated]);

  // Função para verificar se o usuário tem uma determinada role
  const hasRole = (roleName: string): boolean => {
    return state.roles.some(r => r.role === roleName);
  };

  // Função para atualizar as roles do usuário (recarregar)
  const refreshRoles = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;

      const isAdmin = data && 
                     data.length > 0 && 
                     data.some(r => r.role === 'admin');
      
      setState({
        roles: data || [],
        isAdmin,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error("useUserRoles - Erro ao atualizar roles:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));
    }
  };

  return {
    ...state,
    hasRole,
    refreshRoles
  };
} 