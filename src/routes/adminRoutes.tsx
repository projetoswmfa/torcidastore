// Importar o gerenciador de arquivos
import { FileManager } from '../components/admin/FileManager';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Adicionar a rota ao array de rotas
const adminRoutes = [
  {
    path: '/admin/files',
    element: <ProtectedRoute requireAdmin>{<FileManager />}</ProtectedRoute>
  },
] 

export default adminRoutes; 