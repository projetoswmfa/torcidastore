import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const { isAdmin, isLoading: rolesLoading, error } = useUserRoles();
  const location = useLocation();
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const isLoading = authLoading || (requireAdmin && rolesLoading);

  console.log("ProtectedRoute - Renderizando", {
    isAuthenticated,
    isLoading,
    isAdmin,
    requireAdmin,
    user: user?.id,
    path: location.pathname,
    verificationAttempts
  });

  // Se houver erro ao verificar roles, logar para debug
  if (error) {
    console.error("ProtectedRoute - Erro ao verificar permissões:", error);
  }

  useEffect(() => {
    // Se estamos em uma rota protegida, salvar no localStorage e marcar a hora do acesso
    if (location.pathname.startsWith('/admin')) {
      localStorage.setItem('lastAdminRoute', location.pathname);
      localStorage.setItem('lastAdminAccess', new Date().toISOString());
      
      // Adicionando informações persistentes da sessão
      if (user && isAdmin) {
        localStorage.setItem('adminSessionActive', 'true');
        localStorage.setItem('adminSessionUserId', user.id);
        localStorage.setItem('adminSessionEmail', user.email || '');
        localStorage.setItem('adminSessionTimestamp', new Date().toISOString());
      }
    }
  }, [location.pathname, user, isAdmin]);

  // Verificar informações persistentes da sessão durante carregamento
  useEffect(() => {
    if (isLoading && location.pathname.startsWith('/admin')) {
      const adminSessionActive = localStorage.getItem('adminSessionActive');
      const adminSessionTimestamp = localStorage.getItem('adminSessionTimestamp');
      
      if (adminSessionActive === 'true' && adminSessionTimestamp) {
        // Verifica se a sessão persistente não expirou (24 horas)
        const sessionTime = new Date(adminSessionTimestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          console.log("ProtectedRoute - Sessão administrativa persistente encontrada");
        }
      }
    }
  }, [isLoading, location.pathname]);

  useEffect(() => {
    // Se não está mais carregando e a rota atual não é admin, mas há uma lastAdminRoute e o usuário é admin,
    // podemos oferecer um retorno à área administrativa
    if (!isLoading && isAuthenticated && isAdmin && !location.pathname.startsWith('/admin')) {
      const lastAdminRoute = localStorage.getItem('lastAdminRoute');
      const lastAdminAccess = localStorage.getItem('lastAdminAccess');
      
      // Verifica se o acesso anterior foi recente (menos de 1 hora)
      if (lastAdminRoute && lastAdminAccess) {
        const lastAccess = new Date(lastAdminAccess);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 1) {
          // Podemos oferecer um retorno à área administrativa
          console.log("ProtectedRoute - Usuário admin navegando fora da área admin. Último acesso:", hoursDiff.toFixed(2), "horas atrás");
        }
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, location.pathname, navigate]);

  useEffect(() => {
    // Se não está mais carregando e não está autenticado ou não é admin quando necessário, 
    // então devemos redirecionar - mas com mais verificações
    if (!isLoading) {
      if (!isAuthenticated) {
        // Se não for o primeiro carregamento, permitir mais tentativas antes de redirecionar
        if (verificationAttempts < 3) {
          console.log(`ProtectedRoute - Tentativa ${verificationAttempts + 1} de verificação de autenticação`);
          setVerificationAttempts(prev => prev + 1);
          
          // Verificar uma última vez dados persistentes antes de redirecionar
          if (requireAdmin && location.pathname.startsWith('/admin')) {
            const adminSessionActive = localStorage.getItem('adminSessionActive');
            const adminPersistentAuth = localStorage.getItem('adminPersistentAuth');
            
            if (adminSessionActive === 'true' || adminPersistentAuth === 'true') {
              console.log("ProtectedRoute - Dados persistentes encontrados, aguardando antes de decidir redirecionar");
              
              // Dar mais tempo para a autenticação ser recuperada (3 segundos)
              setTimeout(() => {
                // Somente verificar novamente se ainda não está autenticado
                if (!isAuthenticated) {
                  console.log("ProtectedRoute - Após espera, autenticação ainda não recuperada");
                  if (verificationAttempts >= 2) {
                    setShouldRedirect(true);
                  }
                }
              }, 3000);
              return;
            }
          }
          
          // Esperar um pouco antes de decidir redirecionar (1 segundo)
          setTimeout(() => {
            if (!isAuthenticated && verificationAttempts >= 2) {
              setShouldRedirect(true);
            }
          }, 1000);
        } else if (!shouldRedirect) {
          // Se já tentamos várias vezes e ainda não estamos autenticados, redirecionar
          setShouldRedirect(true);
        }
      } else if (requireAdmin && !isAdmin) {
        // Se está autenticado mas não é admin quando requerido
        setShouldRedirect(true);
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, requireAdmin, location.pathname, verificationAttempts]);

  // Limpar dados de sessão expirados
  useEffect(() => {
    const adminSessionTimestamp = localStorage.getItem('adminSessionTimestamp');
    if (adminSessionTimestamp) {
      const sessionTime = new Date(adminSessionTimestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        console.log("ProtectedRoute - Limpando dados de sessão administrativa expirados");
        localStorage.removeItem('adminSessionActive');
        localStorage.removeItem('adminSessionUserId');
        localStorage.removeItem('adminSessionEmail');
        localStorage.removeItem('adminSessionTimestamp');
      }
    }
  }, []);

  // Mostrar indicador de carregamento enquanto verifica a autenticação/permissões
  if (isLoading || verificationAttempts < 3 && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-sport-blue mb-4" />
        <p className="text-slate-400">Verificando autenticação...</p>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para a página de login
  if (shouldRedirect && !isAuthenticated) {
    toast.error("Acesso restrito. Faça login para continuar.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se requer admin mas o usuário não tem permissão, redirecionar para o dashboard
  if (shouldRedirect && requireAdmin && !isAdmin) {
    toast.error("Acesso restrito. Você não tem permissões de administrador.");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Se chegou até aqui, o usuário está autenticado e tem as permissões necessárias
  console.log("ProtectedRoute - Acesso permitido");
  return <>{children}</>;
}; 