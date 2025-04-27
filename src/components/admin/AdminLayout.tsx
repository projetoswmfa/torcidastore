import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Users,
  LineChart,
  Bell,
  Search,
  User,
  BarChart3,
  ShoppingCart,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signOut, user } = useAuthContext();
  const { isAdmin, isLoading: rolesLoading, error } = useUserRoles();
  const isLoading = authLoading || rolesLoading;
  
  console.log("AdminLayout renderizando - authLoading:", authLoading, "rolesLoading:", rolesLoading, "isAdmin:", isAdmin);
  
  // Redireciona para a página de login se não estiver autenticado
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("AdminLayout - Usuário não autenticado, redirecionando para login");
        navigate('/login');
      } else if (!isAdmin) {
        console.log("AdminLayout - Usuário não é admin, redirecionando para home");
        toast.error("Acesso restrito. Você não tem permissões de administrador.");
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  // Se houver erro, registra no console
  useEffect(() => {
    if (error) {
      console.error("AdminLayout - Erro ao verificar permissões de admin:", error);
    }
  }, [error]);
  
  const handleSignOut = async () => {
    try {
      const { success } = await signOut();
      if (success) {
        toast.success("Sessão encerrada com sucesso");
        navigate('/login');
      } else {
        toast.error("Erro ao encerrar a sessão");
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao encerrar a sessão");
    }
  };

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-teal-800">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400 mb-4" />
        <p className="text-white">Verificando permissões...</p>
      </div>
    );
  }
  
  // Se não estiver autenticado ou não for admin, não renderiza nada (redirecionamento já foi iniciado)
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-teal-800">
        <p className="text-white mb-4">Redirecionando...</p>
        <Button 
          onClick={() => navigate('/login')} 
          variant="default"
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          Ir para Login
        </Button>
      </div>
    );
  }
  
  const navigationItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
    },
    {
      name: "Produtos",
      icon: ShoppingBag,
      path: "/admin/produtos",
    },
    {
      name: "Categorias",
      icon: Package,
      path: "/admin/categorias",
    },
    {
      name: "Pedidos",
      icon: ShoppingCart,
      path: "/admin/pedidos",
    },
    {
      name: "Clientes",
      icon: Users,
      path: "/admin/clientes",
    },
    {
      name: "Relatórios",
      icon: FileText,
      path: "/admin/relatorios",
    },
    {
      name: "Análises",
      icon: BarChart3,
      path: "/admin/analises",
    },
    {
      name: "Configurações",
      icon: Settings,
      path: "/admin/configuracoes",
    },
  ];

  return (
    <div className="min-h-screen bg-teal-900/10">
      <header className="fixed top-0 left-0 right-0 h-16 bg-teal-900 shadow-lg flex items-center z-30 px-4 md:px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-teal-800/50 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="ml-4">
              <Link to="/" className="font-bold text-lg text-white">
                Torcida<span className="text-teal-300">Store</span>
              </Link>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <div className="relative hidden md:flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-white/60" />
              <Input
                placeholder="Buscar..."
                className="pl-9 w-64 bg-teal-800/50 border-teal-700 text-white rounded-full
                placeholder:text-white/60 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-white hover:bg-teal-800/50 hover:text-white rounded-full"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>
              
              <div className="border-l border-teal-700 h-8 mx-1" />
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">{user?.email?.split('@')[0] || 'Admin'}</p>
                  <p className="text-xs text-white/70">Administrador</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="pt-16 flex h-[calc(100vh-64px)]">
        {/* Sidebar - Desktop */}
        <aside
          className={cn(
            "fixed md:relative h-[calc(100vh-64px)] z-20 transition-all duration-300 ease-in-out md:block",
            collapsed ? "md:w-[80px]" : "w-[280px]",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "bg-teal-900 text-white border-r border-teal-800 shadow-xl"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center px-6 h-16 mb-2 relative after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-teal-700/50 after:to-transparent">
              {!collapsed && (
                <Link to="/admin" className="font-bold text-lg text-white">
                  Torcida Store <span className="text-teal-300">Admin</span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-white/70 hover:text-white hover:bg-teal-800/50 ml-auto rounded-full",
                  collapsed && "mx-auto"
                )}
                onClick={() => setCollapsed(!collapsed)}
              >
                <ChevronLeft
                  className={cn(
                    "h-5 w-5 transition-transform",
                    collapsed && "rotate-180"
                  )}
                />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="px-3 py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-700/50 scrollbar-track-transparent">
              <div className={cn("mb-4", collapsed && "hidden")}>
                <p className="text-xs uppercase font-semibold text-white/50 px-3 mb-2">
                  Gerenciamento
                </p>
              </div>
              <ul className="space-y-1.5">
                {navigationItems.slice(0, 5).map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        location.pathname === item.path
                          ? "bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md"
                          : "text-white/80 hover:bg-teal-800/50 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          !collapsed && "mr-3",
                          collapsed && "mx-auto"
                        )}
                      />
                      {!collapsed && <span>{item.name}</span>}
                      
                      {!collapsed && location.pathname === item.path && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-teal-400" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              
              {!collapsed && (
                <div className="mt-6 mb-4">
                  <p className="text-xs uppercase font-semibold text-white/50 px-3 mb-2">
                    Sistema
                  </p>
                </div>
              )}
              
              <ul className="space-y-1.5">
                {navigationItems.slice(5).map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        location.pathname === item.path
                          ? "bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md"
                          : "text-white/80 hover:bg-teal-800/50 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          !collapsed && "mr-3",
                          collapsed && "mx-auto"
                        )}
                      />
                      {!collapsed && <span>{item.name}</span>}
                      
                      {!collapsed && location.pathname === item.path && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-teal-400" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Sidebar Footer */}
            <div className="px-3 py-4 mt-auto relative before:content-[''] before:absolute before:top-0 before:left-3 before:right-3 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-teal-700/50 before:to-transparent">
              <Button
                variant="ghost"
                className={cn(
                  "w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-teal-800/50 hover:text-white transition-all",
                  collapsed && "justify-center"
                )}
                onClick={handleSignOut}
              >
                <LogOut
                  className={cn(
                    "h-5 w-5",
                    !collapsed && "mr-3",
                    collapsed && "mx-auto"
                  )}
                />
                {!collapsed && <span>Sair</span>}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto bg-teal-900/10">
          {children}
        </main>
      </div>
    </div>
  );
}
