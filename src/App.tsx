import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/Dashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import NotFound from "./pages/NotFound";
import AuthDiagnostic from "./pages/AuthDiagnostic";
import CategoryProducts from "./pages/CategoryProducts";
import MyOrders from "./pages/MyOrders";
import { AdminLayout } from "./components/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => {
  console.log("Renderizando App"); // Log para debug
  
  return (
    <ThemeProvider attribute="class" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/produto/:id" element={<ProductDetail />} />
                <Route path="/carrinho" element={<Cart />} />
                <Route path="/categoria/:categoryId" element={<CategoryProducts />} />
                <Route path="/meus-pedidos" element={<MyOrders />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Register />} />
                <Route path="/recuperar-senha" element={<ForgotPassword />} />
                {/* <Route path="/redefinir-senha" element={<ResetPassword />} /> */}
                
                {/* Ferramentas de Diagnóstico */}
                <Route path="/auth-diagnostico" element={<AuthDiagnostic />} />
                
                {/* Rotas Administrativas (Protegidas) */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/produtos" element={
                  <ProtectedRoute requireAdmin>
                    <ProductManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categorias" element={
                  <ProtectedRoute requireAdmin>
                    <CategoryManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/pedidos" element={
                  <ProtectedRoute requireAdmin>
                    <OrderManagement />
                  </ProtectedRoute>
                } />
                
                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
