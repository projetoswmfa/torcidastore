import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { HybridImageUpload } from '../ui/HybridImageUpload';
import { AdminLayout } from './AdminLayout';
import { listFiles, searchFilesByMetadata, deleteFile } from '../../integrations/s3/fileStorageService';
import { 
  Loader2, 
  Search, 
  Image, 
  File, 
  Trash2, 
  Download, 
  ExternalLink,
  Tag,
  Clock,
  Calendar,
  Filter
} from 'lucide-react';

interface FileMetadata {
  id: string;
  file_key: string;
  file_path: string;
  s3_url: string;
  content_type: string;
  size: number;
  user_id: string;
  folder: string;
  created_at: string;
  updated_at: string;
  additional_data: Record<string, any>;
}

interface FileSearchOptions {
  folder?: string;
  contentType?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  tags?: string[];
}

export function FileManager() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState<FileSearchOptions>({
    folder: 'all',
    contentType: 'all',
    dateRange: 'all'
  });
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const fileList = await searchFilesByMetadata({}, { limit: 100 });
      setFiles(fileList);
      
      // Extrair pastas disponíveis
      const folders = Array.from(new Set(fileList.map(file => file.folder)));
      setAvailableFolders(folders);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFiles = async () => {
    setLoading(true);
    try {
      const filters: Record<string, any> = {};
      
      // Aplicar filtro de pasta
      if (searchOptions.folder && searchOptions.folder !== 'all') {
        filters.folder = searchOptions.folder;
      }
      
      // Aplicar filtro de tipo de conteúdo
      if (searchOptions.contentType && searchOptions.contentType !== 'all') {
        filters.content_type = searchOptions.contentType;
      }
      
      // Aplicar filtro de data
      if (searchOptions.dateRange && searchOptions.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (searchOptions.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        filters.created_at = { gte: startDate.toISOString() };
      }
      
      // Aplicar busca por texto
      if (searchTerm) {
        // Buscar no caminho do arquivo, metadata e url
        filters.file_path = { like: `%${searchTerm}%` };
      }
      
      const searchResults = await searchFilesByMetadata(filters, { 
        limit: 100,
        orderBy: 'created_at',
        ascending: false
      });
      
      setFiles(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const result = await deleteFile(key);
      if (result.success) {
        setFiles(files.filter(f => f.file_key !== key));
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleUploadSuccess = (imageUrl: string, key: string) => {
    loadFiles(); // Recarregar a lista após upload
    setShowUploader(false);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gerenciador de Arquivos</h1>
          <Button onClick={() => setShowUploader(!showUploader)}>
            {showUploader ? 'Cancelar Upload' : 'Upload de Arquivo'}
          </Button>
        </div>

        {showUploader && (
          <div className="mb-8 p-4 border rounded-md">
            <h2 className="text-lg font-medium mb-4">Upload de Arquivo</h2>
            <HybridImageUpload
              folder="uploads"
              description="Upload pelo gerenciador de arquivos"
              tags={['gerenciador']}
              onSuccess={handleUploadSuccess}
            />
          </div>
        )}

        <div className="mb-6 p-4 border rounded-md">
          <h2 className="text-lg font-medium mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar por nome de arquivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Select 
                value={searchOptions.folder || 'all'} 
                onValueChange={(value) => setSearchOptions({...searchOptions, folder: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as pastas</SelectItem>
                  {availableFolders.map(folder => (
                    <SelectItem key={folder} value={folder}>
                      {folder || 'Raiz'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={searchOptions.contentType || 'all'} 
                onValueChange={(value) => setSearchOptions({...searchOptions, contentType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de arquivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="image/jpeg">Imagem JPEG</SelectItem>
                  <SelectItem value="image/png">Imagem PNG</SelectItem>
                  <SelectItem value="image/webp">Imagem WebP</SelectItem>
                  <SelectItem value="image/gif">Imagem GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={searchOptions.dateRange || 'all'} 
                onValueChange={(value) => setSearchOptions({
                  ...searchOptions, 
                  dateRange: value as 'today' | 'week' | 'month' | 'all'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={searchFiles} className="flex items-center">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Tipo</TableHead>
                <TableHead>Nome do arquivo</TableHead>
                <TableHead>Pasta</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data de upload</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Carregando arquivos...</p>
                  </TableCell>
                </TableRow>
              ) : files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-gray-500">Nenhum arquivo encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      {getFileIcon(file.content_type)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {file.file_key.split('/').pop()}
                    </TableCell>
                    <TableCell>{file.folder || 'Raiz'}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{formatDate(file.created_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <a 
                        href={file.s3_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 text-gray-500 hover:text-gray-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteFile(file.file_key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
} 