import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Log para debug
  console.log("useAuth - Estado atual:", {
    user: authState.user?.id,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated
  });

  useEffect(() => {
    // Verifica a sessão atual quando o componente é montado
    const checkSession = async () => {
      console.log("useAuth - Verificando sessão atual...");
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("useAuth - Erro na verificação de sessão:", error);
          throw error;
        }

        console.log("useAuth - Sessão atual:", data.session?.user?.id);
        
        // Se há sessão, atualizar o estado imediatamente
        if (data.session) {
          console.log("useAuth - Sessão encontrada, atualizando estado de autenticação");
          updateAuthState(data.session);
          // Também atualizar dados persistentes se for admin
          if (data.session.user.email === 'torcida.store@gmail.com') {
            updatePersistentAdminData(data.session);
          }
          return; // Sair da função se sessão foi encontrada
        }
        
        // Se não há sessão, verificar se há dados persistentes do admin
        console.log("useAuth - Sessão atual não encontrada, verificando dados persistentes");
        const adminPersistentAuth = localStorage.getItem('adminPersistentAuth');
        const adminPersistentEmail = localStorage.getItem('adminPersistentEmail');
        const adminPersistentTimestamp = localStorage.getItem('adminPersistentTimestamp');
        const adminAuth = localStorage.getItem('adminAuth');
        
        // Verificar se os dados persistentes existem e são recentes (menos de 24 horas)
        if (adminPersistentAuth === 'true' && 
            adminPersistentEmail && 
            adminPersistentTimestamp && 
            adminAuth) {
          
          const persistTime = new Date(adminPersistentTimestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - persistTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) { // Aumentado para 24 horas para maior flexibilidade
            console.log("useAuth - Dados persistentes válidos encontrados, tentando restaurar sessão");
            
            try {
              // Decodificar os tokens armazenados
              const sessionInfo = JSON.parse(atob(adminAuth));
              
              // Tentar restaurar a sessão com o token de atualização
              if (sessionInfo.refresh_token) {
                console.log("useAuth - Tentando restaurar sessão com refresh token");
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                  refresh_token: sessionInfo.refresh_token
                });
                
                if (refreshError) {
                  console.error("useAuth - Erro ao restaurar sessão:", refreshError);
                  // Limpar dados persistentes se o refresh falhar
                  clearPersistentAdminData();
                } else if (refreshData.session) {
                  console.log("useAuth - Sessão restaurada com sucesso!");
                  updateAuthState(refreshData.session);
                  
                  // Atualizar os tokens armazenados
                  updatePersistentAdminData(refreshData.session);
                  return; // Sair da função se conseguiu restaurar a sessão
                }
              }
            } catch (err) {
              console.error("useAuth - Erro ao processar tokens persistentes:", err);
              // Limpar dados persistentes em caso de erro
              clearPersistentAdminData();
            }
          } else {
            console.log("useAuth - Dados persistentes expirados, limpando");
            clearPersistentAdminData();
          }
        }
      } catch (error) {
        console.error('useAuth - Erro ao verificar sessão:', error);
      } finally {
        console.log("useAuth - Finalizando verificação de sessão, setando isLoading=false");
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    // Configura o listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("useAuth - Evento de autenticação:", event, session?.user?.id);
        updateAuthState(session);
        
        // Se evento de login e é o admin principal, atualizar dados persistentes
        if (event === 'SIGNED_IN' && session?.user?.email === 'torcida.store@gmail.com') {
          updatePersistentAdminData(session);
        }
        
        // Se evento de logout, limpar dados persistentes
        if (event === 'SIGNED_OUT') {
          clearPersistentAdminData();
        }
      }
    );

    checkSession();

    // Limpa o listener quando o componente é desmontado
    return () => {
      console.log("useAuth - Limpando listener de autenticação");
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Atualiza o estado de autenticação
  const updateAuthState = (session: Session | null) => {
    console.log("useAuth - Atualizando estado de autenticação:", !!session);
    setAuthState({
      user: session?.user || null,
      session,
      isLoading: false,
      isAuthenticated: !!session,
    });
  };

  // Função auxiliar para atualizar dados persistentes do admin
  const updatePersistentAdminData = (session: Session) => {
    try {
      console.log("useAuth - Atualizando dados persistentes do admin");
      localStorage.setItem('adminPersistentAuth', 'true');
      localStorage.setItem('adminPersistentEmail', session.user.email || '');
      localStorage.setItem('adminPersistentId', session.user.id || '');
      localStorage.setItem('adminPersistentTimestamp', new Date().toISOString());
      
      // Salvar tokens da sessão
      const sessionInfo = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // expiração em 1 hora
      });
      localStorage.setItem('adminAuth', btoa(sessionInfo));
    } catch (err) {
      console.error("useAuth - Erro ao salvar dados persistentes:", err);
    }
  };
  
  // Função auxiliar para limpar dados persistentes
  const clearPersistentAdminData = () => {
    console.log("useAuth - Limpando dados persistentes do admin");
    localStorage.removeItem('adminPersistentAuth');
    localStorage.removeItem('adminPersistentEmail');
    localStorage.removeItem('adminPersistentId');
    localStorage.removeItem('adminPersistentTimestamp');
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminSessionActive');
    localStorage.removeItem('adminSessionUserId');
    localStorage.removeItem('adminSessionEmail');
    localStorage.removeItem('adminSessionTimestamp');
  };

  // Funções de autenticação
  const signIn = async (email: string, password: string) => {
    console.log("useAuth - Tentando fazer login com:", email);
    try {
      console.log("useAuth - Iniciando processo de autenticação no Supabase");
      // Tenta o login com o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("useAuth - Erro no login com Supabase:", error);
        console.error("useAuth - Detalhes do erro:", {
          message: error.message,
          code: error.code,
          status: error.status
        });
        
        // Formatar o erro para uma mensagem mais amigável
        const formattedError: AuthError = {
          message: 'Erro durante autenticação'
        };

        // Mapear códigos de erro para mensagens mais amigáveis
        if (error.message.includes('Invalid login credentials')) {
          formattedError.message = 'Credenciais de login inválidas. Verifique seu email e senha.';
          formattedError.code = 'invalid_credentials';
        } else if (error.message.includes('Email not confirmed')) {
          formattedError.message = 'Email não confirmado. Por favor, verifique sua caixa de entrada e confirme seu email.';
          formattedError.code = 'email_not_confirmed';
        } else {
          formattedError.message = error.message;
          formattedError.code = error.code;
        }

        throw formattedError;
      }

      console.log("useAuth - Login bem-sucedido com Supabase:", data.user?.id);
      console.log("useAuth - Detalhes da sessão:", {
        userId: data.user?.id,
        email: data.user?.email,
        lastSignIn: data.user?.last_sign_in_at
      });
      
      // Para qualquer usuário, salvar a sessão - extendido para todos os usuários
      if (data.session) {
        console.log("useAuth - Salvando dados da sessão");
        
        // Para o usuário torcida.store@gmail.com, salvar dados persistentes adicionais
        if (email.toLowerCase() === 'torcida.store@gmail.com') {
          updatePersistentAdminData(data.session);
        }
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('useAuth - Erro no login:', error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      console.log("useAuth - Iniciando logout");
      
      // Limpar dados persistentes antes do logout
      clearPersistentAdminData();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("useAuth - Erro no logout:", error);
        throw error;
      }
      
      console.log("useAuth - Logout bem-sucedido");
      return { success: true };
    } catch (error) {
      console.error('useAuth - Erro ao fazer logout:', error);
      return { success: false, error };
    }
  };

  // Função para registrar novo usuário
  const signUp = async (email: string, password: string, userData?: { fullName?: string }) => {
    try {
      console.log("useAuth - Tentando registrar novo usuário:", email);
      
      // Validação mais robusta de email antes de enviar para o Supabase
      // Padrão de email mais rigoroso que verifica TLDs com 2 ou mais caracteres
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        console.error("useAuth - Email inválido (falhou na validação regex):", email);
        return { 
          success: false, 
          error: { 
            message: 'Email inválido. Por favor, forneça um endereço de email válido.',
            code: 'invalid_email' 
          }
        };
      }

      console.log("useAuth - Email validado, enviando para o Supabase:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.fullName || '',
          },
        },
      });

      if (error) {
        console.error("useAuth - Erro no registro:", error);
        console.error("useAuth - Detalhes do erro:", {
          message: error.message,
          code: error.code,
          status: error.status
        });
        
        const formattedError: AuthError = {
          message: error.message,
          code: error.code
        };

        // Mapear códigos de erro para mensagens mais amigáveis
        if (error.message.includes('User already registered')) {
          formattedError.message = 'Este email já está registrado. Tente fazer login ou recuperar sua senha.';
          formattedError.code = 'user_exists';
        } else if (error.message.includes('invalid')) {
          formattedError.message = 'Email inválido. Por favor, forneça um endereço de email válido.';
          formattedError.code = 'invalid_email';
        }

        throw formattedError;
      }

      console.log("useAuth - Registro bem-sucedido:", data.user?.id);
      console.log("useAuth - Detalhes do usuário registrado:", {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmationRequired: !data.session
      });
      
      return { 
        success: true, 
        data,
        emailConfirmationRequired: !data.session  // Se não há sessão, é porque confirmação por email é requerida
      };
    } catch (error) {
      console.error('useAuth - Erro no cadastro:', error);
      return { success: false, error };
    }
  };

  // Função para recuperar senha
  const resetPassword = async (email: string) => {
    try {
      console.log("useAuth - Solicitando redefinição de senha para:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        console.error("useAuth - Erro na redefinição de senha:", error);
        throw error;
      }

      console.log("useAuth - Solicitação de redefinição de senha enviada com sucesso");
      return { success: true };
    } catch (error) {
      console.error('useAuth - Erro ao solicitar redefinição de senha:', error);
      return { success: false, error };
    }
  };

  return {
    ...authState,
    signIn,
    signOut,
    signUp,
    resetPassword,
  };
} 