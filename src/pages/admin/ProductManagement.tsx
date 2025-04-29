import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Pencil, 
  Trash2,
  Search,
  FileUp,
  Loader2,
  X,
  Star,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { uploadProductImage, getProductImageUrl } from "@/integrations/supabase/storage";
import { useS3Upload } from "@/hooks/useS3Upload";
import { v4 as uuidv4 } from 'uuid';
import { S3ImageUpload } from "@/components/ui/S3ImageUpload";
import { TablesUpdate } from "@/integrations/supabase/types";

// Interface para as imagens do produto
interface ProductImage {
  id: string;
  storage_path: string;
  is_primary: boolean;
  alt_text: string | null;
  product_id: string;
  created_at: string;
  updated_at: string;
  file_size: number | null;
  height: number | null;
  width: number | null;
  mime_type: string | null;
  original_filename: string | null;
  url: string;
  s3_key: string;
}

// Imagem de placeholder incorporada como base64 para evitar problemas de DNS
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5gQaFwsOqyW9VQAAB+5JREFUeNrt3T1oXOcZxvH/kWTJH7IdG2M7JHEUu3YcO9hgQsGUkibQNqRQCHRRSdqmTaFdXEJDoUvboeCSLdClgymdDKVT6WAsO5JlLMmyLen0de5yliPJ0tU9V+e+1/P7gDG60pXOeXTve973fZ5zRgIAAAAAAAAAAAAAAACAwaXYAOx9QZ6ZmUn2+0dGRpLlztzcXJLc89pbU9FPMtGPXBSZZFUNI5Xk3nMvj74w6tvs/f8t/N+SdCz3nkgaqalvRUbS9aJo0AEYsNqnT3rjjTeSff6lS5eS5c5z9aeZSPr+qG+zwX6/5aZIerWYDMp3QJJP9Pmz3wfDgTlYAAhDwAJAGAIWAMIQsAAQhoAFgDAELACEIWABIAwBCwAhCFgACEPAAkAYAhYAwhCwABCGgAWAMAQsAIQhYAEgDAELAGEIWAAI83/Y3V4bPJrRtQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wNC0yNlQyMzoxMToxNCswMDowMLsim8IAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDQtMjZUMjM6MTE6MTQrMDA6MDDKfy1+AAAAAElFTkSuQmCC';

// Função para verificar se uma string é uma URL válida
const isValidUrl = (urlString: string): boolean => {
  if (!urlString) return false;
  
  try {
    return urlString.startsWith('http://') || urlString.startsWith('https://');
  } catch (e) {
    return false;
  }
};

// Função para verificar se uma string é um caminho válido do storage
const isStoragePath = (path: string): boolean => {
  if (!path) return false;
  
  // Verificações mais robustas para caminhos de storage
  // Um caminho de storage válido:
  // 1. Não deve ser uma URL completa (não começa com http ou https)
  // 2. Deve conter pelo menos uma barra (/) indicando estrutura de pastas
  //    OU corresponder ao padrão [UUID]/timestamp.extensão usado pelo Supabase
  return !path.startsWith('http') && 
    (
      path.includes('/') || 
      // Regex para detectar padrão UUID/timestamp.extensão (aproximado)
      /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}\/\d+\.[a-zA-Z0-9]+$/.test(path) ||
      // Também verifica se está no formato simples de ID/timestamp.extensão
      /^[a-zA-Z0-9-]+\/\d+\.[a-zA-Z0-9]+$/.test(path)
    );
};

// Função para obter a URL correta da imagem, seja um path no storage ou uma URL completa
const getCorrectImageUrl = (imagePath: string): string => {
  console.group(`Processando URL: ${imagePath}`);
  
  if (!imagePath || typeof imagePath !== 'string') {
    console.log('Caminho inválido ou vazio, usando placeholder');
    console.groupEnd();
    return PLACEHOLDER_IMAGE;
  }
  
  // Limpeza básica
  const cleanPath = imagePath.trim();
  
  if (isValidUrl(cleanPath)) {
    console.log('Detectada URL válida, usando diretamente');
    console.groupEnd();
    return cleanPath;
  }
  
  console.log('Verificando caminho:', cleanPath);
  console.log('Resultado isStoragePath:', isStoragePath(cleanPath));
  
  if (isStoragePath(cleanPath)) {
    try {
      console.log('Detectado caminho de storage, convertendo para URL pública');
      const url = getProductImageUrl(cleanPath);
      console.log('URL gerada:', url);
      console.groupEnd();
      return url;
    } catch (error) {
      console.error("Erro ao converter caminho para URL:", error);
      console.groupEnd();
      return PLACEHOLDER_IMAGE;
    }
  }
  
  // Tentativa final de resolver a URL mesmo se o detector falhar
  console.log('Detector normal falhou, tentando forçar resolução via getProductImageUrl');
  try {
    const forcedUrl = getProductImageUrl(cleanPath);
    console.log('URL forçada gerada:', forcedUrl);
    console.groupEnd();
    return forcedUrl;
  } catch (error) {
    console.error("Erro ao forçar conversão de caminho para URL:", error);
  console.log('Não foi possível determinar o tipo de caminho, usando placeholder');
  console.groupEnd();
  return PLACEHOLDER_IMAGE;
  }
};

// Função para depuração das imagens
const debugImageUrls = (images: ProductImage[]) => {
  console.group('Depuração de Imagens do Produto');
  console.log('Total de imagens:', images.length);
  
  images.forEach((img, index) => {
    console.group(`Imagem ${index + 1}`);
    console.log('ID:', img.id);
    console.log('Path original:', img.storage_path);
    console.log('URL gerada:', getCorrectImageUrl(img.storage_path));
    console.log('É principal:', img.is_primary);
    console.groupEnd();
  });
  
  console.groupEnd();
};

export default function ProductManagement() {
  const { products, loading: productsLoading, fetchProducts } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { uploading: uploadingS3, error: errorS3, uploadImage } = useS3Upload();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    image_url: PLACEHOLDER_IMAGE
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{[key: number]: File | null}>({
    0: null,
    1: null,
    2: null
  });
  const [loadingImages, setLoadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filtrar produtos baseado na busca
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Buscar imagens do produto
  const fetchProductImages = async (productId: string) => {
    // Identificador único para esta operação de carregamento
    const loadingId = Date.now();
    console.log(`Iniciando carregamento #${loadingId} para o produto: ${productId}`);
    
    setLoadingImages(true);
    try {
      console.log(`[${loadingId}] Buscando imagens para o produto:`, productId);
      console.log(`[${loadingId}] Produto selecionado:`, selectedProduct);
      
      // Verifique se ainda estamos editando o mesmo produto
      if (!selectedProduct || selectedProduct.id !== productId) {
        console.log(`[${loadingId}] Produto selecionado mudou durante o carregamento, abortando`);
        return;
      }
      
      const { data, error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      
      console.log(`[${loadingId}] Imagens encontradas na tabela image_metadata:`, data?.length || 0);
      
      // Verifique novamente se ainda estamos editando o mesmo produto
      if (!selectedProduct || selectedProduct.id !== productId) {
        console.log(`[${loadingId}] Produto selecionado mudou durante o processamento, abortando`);
        return;
      }
      
      // Se não houver imagens na tabela image_metadata, verificamos se existe uma image_url válida no produto
      if (!data || data.length === 0) {
        console.log(`[${loadingId}] Verificando image_url do produto:`, selectedProduct?.image_url);
        
        if (selectedProduct?.image_url && 
            selectedProduct.image_url !== PLACEHOLDER_IMAGE &&
            selectedProduct.image_url.trim() !== '') {
          console.log(`[${loadingId}] Usando image_url do produto como imagem principal`);
          // Criar uma entrada temporária para exibir a imagem principal do produto
          const tempImages: ProductImage[] = [{
            id: 'main', // ID temporário
            product_id: productId,
            storage_path: selectedProduct.image_url,
            is_primary: true,
            alt_text: selectedProduct.name,
            created_at: '',
            updated_at: '',
            file_size: null,
            height: null,
            width: null,
            mime_type: null,
            original_filename: null,
            url: selectedProduct.image_url,
            s3_key: selectedProduct.image_url
          }];
          
          setProductImages(tempImages);
          debugImageUrls(tempImages);
        } else {
          console.log(`[${loadingId}] Produto sem imagens válidas`);
          // Produto sem imagens
          setProductImages([]);
        }
      } else {
        setProductImages(data);
        debugImageUrls(data);
      }
    } catch (error) {
      console.error(`[${loadingId}] Erro ao buscar imagens do produto:`, error);
      toast.error("Erro ao carregar imagens do produto");
      setProductImages([]);
    } finally {
      console.log(`[${loadingId}] Finalizando carregamento de imagens`);
      setLoadingImages(false);
    }
  };

  // Corrigir função de toast de erro
  const showErrorToast = (message: string) => {
    toast.error(message);
  };

  // Funções de manipulação 
  const handleEdit = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      // Limpar estados anteriores de imagens para evitar que as imagens antigas fiquem visíveis
      setProductImages([]);
      setSelectedFiles({
        0: null,
        1: null,
        2: null
      });
      
      // Primeiro definir o produto para a interface atualizar
      setSelectedProduct(product);
      setIsEditDialogOpen(true);
      
      // Se o produto tem uma image_url válida, já mostramos ela enquanto carregamos as demais
      if (product.image_url && 
          product.image_url !== PLACEHOLDER_IMAGE &&
          product.image_url.trim() !== '') {
        setProductImages([{
          id: 'temp-main', // ID temporário
          product_id: id,
          storage_path: product.image_url,
          is_primary: true,
          alt_text: product.name,
          created_at: '',
          updated_at: '',
          file_size: null,
          height: null,
          width: null,
          mime_type: null,
          original_filename: null,
          url: product.image_url,
          s3_key: product.image_url
        }]);
      }
      
      // Pequeno atraso para garantir que os estados anteriores foram limpos
      setTimeout(() => {
        // Agora buscamos as imagens completas
        fetchProductImages(id);
      }, 100);
    } else {
      showErrorToast("Produto não encontrado");
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    
    try {
      // Preparar dados para atualização
      const updateData: TablesUpdate<"products"> = {
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price.toString()),
        description: selectedProduct.description,
        category_id: selectedProduct.category_id,
        subcategory_id: selectedProduct.subcategory_id || null,
        updated_at: new Date().toISOString()
      };
      
      // Se há uma imagem principal nova e ainda não foi salva, salvar primeiro
      if (selectedProduct.image_url && !isStoragePath(selectedProduct.image_url) && selectedProduct.image_url !== PLACEHOLDER_IMAGE) {
        // Não incluir image_url no updateData, será atualizada junto com as imagens do produto
      }
      
      // Atualizar dados do produto
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProduct.id);
      
      if (error) throw error;
      
      // Fazer upload das novas imagens selecionadas
      const uploadPromises = Object.entries(selectedFiles)
        .filter(([_key, file]) => file !== null)
        .map(async ([key, file]) => {
          if (!file) return null;
          
          const filePath = await uploadProductImage(file, selectedProduct.id);
          
          // Determinar se é a imagem principal (a primeira é a principal por padrão)
          const isPrimary = parseInt(key) === 0 && productImages.length === 0;
          
          // Registrar os metadados da imagem
          const { data, error: metadataError } = await supabase
            .from('image_metadata')
            .insert({
              product_id: selectedProduct.id,
              s3_key: filePath,
              url: filePath,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (metadataError) throw metadataError;
          
          return data;
        });
      
      await Promise.all(uploadPromises);

      toast.success("Produto atualizado com sucesso!");
      setIsEditDialogOpen(false);
      
      // Limpar todos os estados relacionados 
      setSelectedProduct(null);
      setProductImages([]);
      setSelectedFile(null);
      setSelectedFiles({
        0: null,
        1: null,
        2: null
      });
      
      // Recarregar os produtos após atualizar
      fetchProducts();
    } catch (error) {
      console.error("Edição: Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showErrorToast(`Produto excluído com sucesso!`);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      showErrorToast("Erro ao excluir produto. Tente novamente.");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      // Caso especial: imagem principal do produto (não da tabela image_metadata)
      if (imageId === 'main' && selectedProduct) {
        // Atualizar a URL da imagem no produto para o valor padrão
        const { error } = await supabase
          .from('products')
          .update({ image_url: PLACEHOLDER_IMAGE })
          .eq('id', selectedProduct.id);
        
        if (error) throw error;
        
        // Atualizar o estado local do produto selecionado
        setSelectedProduct({
          ...selectedProduct,
          image_url: PLACEHOLDER_IMAGE
        });
        
        // Limpar imagens
        setProductImages([]);
        
        showErrorToast("Imagem removida com sucesso!");
        return;
      }
      
      // Caso normal: imagem da tabela image_metadata
      const imageToDelete = productImages.find(img => img.id === imageId);
      if (!imageToDelete) return;
      
      // Excluir o registro do banco de dados
      const { error } = await supabase
        .from('image_metadata')
        .delete()
        .eq('id', imageId);
      
      if (error) throw error;
      
      // Atualizar estado local
      setProductImages(prevImages => prevImages.filter(img => img.id !== imageId));
      
      showErrorToast("Imagem removida com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir imagem:", error);
      showErrorToast("Erro ao remover imagem. Tente novamente.");
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      // Para imagens da tabela image_metadata
      if (imageId !== 'main') {
        // Não temos campo is_primary no schema atual, então vamos apenas
        // atualizar a URL da imagem no produto
        
        // Atualizar imagem principal do produto com a URL da imagem selecionada
        const selectedImage = productImages.find(img => img.id === imageId);
        if (selectedImage && selectedProduct) {
          // Usar s3_key ou url dependendo de qual campo contém o caminho
          const imageUrl = selectedImage.url || selectedImage.s3_key;
          
          // Cast para TablesUpdate para resolver problemas de tipo
          const updateData = { 
            image_url: imageUrl 
          };
          
          const { error } = await supabase
            .from('products')
            .update(updateData as unknown as TablesUpdate<'products'>)
            .eq('id', selectedProduct.id);
            
          if (error) throw error;
          
          // Atualizar o estado local do produto
          setSelectedProduct({
            ...selectedProduct,
            image_url: imageUrl
          });
        }
      }
      
      // Atualizar estado local para mostrar ao usuário qual é a imagem principal
      // (mesmo que não tenhamos o campo is_primary no banco de dados)
      setProductImages(prevImages => 
        prevImages.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      );
      
      toast.success("Imagem principal definida com sucesso!");
    } catch (error) {
      console.error("Erro ao definir imagem principal:", error);
      showErrorToast("Erro ao definir imagem principal. Tente novamente.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setNewProduct(prev => ({ ...prev, [id]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    if (selectedProduct) {
      setSelectedProduct(prev => ({ ...prev, [id]: value }));
    }
  };

  // Função handleFileChange modificada para upload direto para AWS S3
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Criar uma prévia da imagem para mostrar imediatamente
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    
    // Iniciar o upload da imagem para AWS S3
    setUploadingImage(true);
    
    try {
      // Gerar um ID temporário para o produto (será usado apenas para o upload)
      const tempProductId = uuidv4();
      
      // Fazer upload para o AWS S3 utilizando o hook de upload
      const { imageUrl } = await uploadImage(file, tempProductId);
      
      // Atualizar o estado do novo produto com a URL da imagem
      setNewProduct(prev => ({
        ...prev,
        image_url: imageUrl
      }));
      
      toast.success("Imagem enviada com sucesso! Ela será associada ao produto quando você salvar.");
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleMultipleFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => ({
        ...prev,
        [index]: e.target.files![0]
      }));
    }
  };

  const handleAddProduct = async () => {
    try {
      setIsSubmitting(true);

      // Verificar se todos os campos obrigatórios estão preenchidos
      if (!newProduct.name || !newProduct.price || !newProduct.category_id) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      // Verificar se há uma imagem válida
      const hasValidImage = newProduct.image_url && newProduct.image_url !== PLACEHOLDER_IMAGE;
      
      // Verificamos se a categoria selecionada é uma que não tem subcategorias
      const isCategoryWithoutSubcategories = ['5', '6'].includes(newProduct.category_id);
      
      // Se não temos subcategoria selecionada, vamos criar uma subcategoria padrão ou usar uma existente
      if (!newProduct.subcategory_id || isCategoryWithoutSubcategories) {
        try {
          console.log("Criando ou buscando subcategoria padrão para categoria:", newProduct.category_id);
          
          // Primeiro, verificamos se já existe uma subcategoria padrão para esta categoria
          const { data: existingSubcategories } = await supabase
            .from('subcategories')
            .select('id, name')
            .eq('category_id', newProduct.category_id);
          
          console.log("Subcategorias existentes:", existingSubcategories);
          
          // Se encontramos subcategorias, usamos a primeira. Caso contrário, criamos uma nova.
          if (existingSubcategories && existingSubcategories.length > 0) {
            // Usar a primeira subcategoria disponível
            newProduct.subcategory_id = existingSubcategories[0].id;
            console.log("Usando subcategoria existente:", existingSubcategories[0]);
          } else {
            // Criar uma subcategoria padrão
            console.log("Criando nova subcategoria padrão");
            const { data: newSubcategory, error: subcatError } = await supabase
              .from('subcategories')
              .insert({
                name: 'Padrão',
                category_id: newProduct.category_id,
                created_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (subcatError) {
              console.error("Erro ao criar subcategoria padrão:", subcatError);
              throw subcatError;
            }
            
            if (newSubcategory) {
              newProduct.subcategory_id = newSubcategory.id;
              console.log("Nova subcategoria criada com ID:", newSubcategory.id);
            } else {
              throw new Error("Falha ao criar subcategoria padrão");
            }
          }
        } catch (subcatError) {
          console.error("Erro ao processar subcategoria:", subcatError);
          toast.error("Erro ao processar subcategoria. Tente novamente.");
          setIsSubmitting(false);
          return;
        }
      }
      
      // Garantir que temos um subcategory_id antes de inserir o produto
      if (!newProduct.subcategory_id) {
        console.error("Falha ao obter subcategory_id");
        toast.error("Erro ao processar subcategoria. Tente novamente.");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Inserindo produto com subcategory_id:", newProduct.subcategory_id);
      
      // Passo 1: Inserir o produto na tabela de produtos
      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          price: typeof newProduct.price === 'string' 
            ? parseFloat(newProduct.price) 
            : newProduct.price,
          image_url: hasValidImage ? newProduct.image_url : null,
          description: newProduct.description || null,
          category_id: newProduct.category_id,
          subcategory_id: newProduct.subcategory_id
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao inserir produto:", error);
        throw error;
      }

      // Passo 2: Se houver uma imagem válida, registrar os metadados da imagem
      if (hasValidImage && selectedFile) {
        // A URL da imagem já foi obtida durante o upload, então podemos usá-la para registrar metadados
        const { error: metadataError } = await supabase
          .from('image_metadata')
          .insert({
            product_id: insertedProduct.id,
            s3_key: newProduct.image_url,
            url: newProduct.image_url,
            created_at: new Date().toISOString()
          });

        if (metadataError) {
          console.error("Erro ao registrar metadados da imagem:", metadataError);
          // Não vamos lançar este erro para não impedir a adição do produto
        }
      }

      toast.success("Produto adicionado com sucesso!");
      setIsAddDialogOpen(false);
      
      // Resetar o estado do novo produto
      setNewProduct({
        name: '',
        price: '',
        image_url: PLACEHOLDER_IMAGE,
        description: '',
        category_id: '',
        subcategory_id: ''
      });
      setSelectedFile(null);
      
      // Recarregar a lista de produtos
      fetchProducts();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast.error("Erro ao adicionar produto. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filtrar subcategorias baseado na categoria selecionada
  const availableSubcategories = categories.find(
    cat => cat.id === newProduct.category_id
  )?.subcategories || [];
  
  // Filtrar subcategorias para o produto em edição
  const editSubcategories = selectedProduct ? categories.find(
    cat => cat.id === selectedProduct.category_id
  )?.subcategories || [] : [];

  // Efeito para limpar estados quando o modal for fechado
  useEffect(() => {
    let isMounted = true;
    
    if (!isEditDialogOpen && isMounted) {
      // Limpar todos os estados relacionados às imagens quando o modal for fechado
      setSelectedProduct(null);
      setProductImages([]);
      setSelectedFiles({
        0: null,
        1: null,
        2: null
      });
      setLoadingImages(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [isEditDialogOpen]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-teal-50">Gerenciamento de Produtos</h1>
          <p className="text-teal-100/85">
            Adicione, edite e gerencie produtos da loja.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md rounded-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-teal-900 border-teal-700 text-teal-50 rounded-xl shadow-xl overflow-y-auto max-h-[95vh] md:max-w-3xl lg:max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-teal-50">Adicionar Novo Produto</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium text-teal-200">
                      Nome do Produto
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={newProduct.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Camisa Barcelona Home 2023/24"
                      className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="price" className="text-sm font-medium text-teal-200">
                      Preço
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={newProduct.price}
                      onChange={handleInputChange}
                      placeholder="Ex: 299.90"
                      className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium text-teal-200">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange as any}
                    placeholder="Descreva o produto"
                    rows={3}
                    className="resize-none bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600 rounded-md px-3 py-2"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="category_id" className="text-sm font-medium text-teal-200">
                      Categoria
                    </label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={newProduct.category_id}
                      onChange={handleInputChange as any}
                      className="bg-teal-800/50 border-teal-700 text-teal-50 focus:border-teal-600 rounded-md px-3 py-2"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Ocultar campo de subcategoria para categorias sem subcategorias */}
                  {!['5', '6'].includes(newProduct.category_id) && (
                    <div className="grid gap-2">
                      <label htmlFor="subcategory_id" className="text-sm font-medium text-teal-200">
                        Subcategoria
                      </label>
                      <select
                        id="subcategory_id"
                        name="subcategory_id"
                        value={newProduct.subcategory_id}
                        onChange={handleInputChange as any}
                        className="bg-teal-800/50 border-teal-700 text-teal-50 focus:border-teal-600 rounded-md px-3 py-2"
                      >
                        <option value="">Selecione uma subcategoria</option>
                        {availableSubcategories.map(subcategory => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="image_upload" className="text-sm font-medium text-teal-200">
                    Imagem do Produto
                  </label>
                  <div className="flex flex-col items-center p-4 border-2 border-dashed border-teal-700 rounded-md bg-teal-800/30 transition-colors hover:bg-teal-800/50">
                    {previewUrl ? (
                      <div className="relative w-full max-w-xs mx-auto">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-auto max-h-48 rounded-md mb-2 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-teal-900/70 rounded-full hover:bg-teal-900 text-teal-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full text-center py-4">
                        <ImageIcon className="h-12 w-12 text-teal-400 mb-2 mx-auto" />
                        <p className="text-sm text-teal-200 mb-2">Arraste uma imagem ou clique para fazer upload</p>
                        <input
                          id="image_upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image_upload')?.click()}
                          className="bg-teal-700 hover:bg-teal-600 text-teal-50 border-teal-600 mx-auto"
                        >
                          <FileUp className="h-4 w-4 mr-2" />
                          Selecionar Imagem
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="bg-transparent border-teal-600 text-teal-100 hover:bg-teal-800 hover:text-teal-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Adicionar Produto'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300" />
          <Input
            placeholder="Buscar produtos por nome ou categoria..."
            className="pl-10 bg-teal-800/30 border-teal-700 text-teal-50 placeholder:text-teal-400/70 focus:border-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {productsLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <span className="ml-2 text-lg text-teal-100">Carregando produtos...</span>
        </div>
      ) : (
        <div className="rounded-xl border border-teal-700 overflow-hidden bg-teal-800/30 shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-800/50">
                <TableHead className="text-teal-50 font-medium">Imagem</TableHead>
                <TableHead className="text-teal-50 font-medium">Nome</TableHead>
                <TableHead className="text-teal-50 font-medium">Preço</TableHead>
                <TableHead className="text-teal-50 font-medium">Categoria</TableHead>
                <TableHead className="text-teal-50 font-medium">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-teal-100/70">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-teal-700/30 transition-colors border-b border-teal-700/30">
                    <TableCell>
                      <div className="h-12 w-12 rounded overflow-hidden bg-teal-900/30">
                        <img
                          src={getCorrectImageUrl(product.image_url)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-teal-100">
                      {product.name}
                      {product.is_new && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <Star className="mr-1 h-3 w-3 text-amber-500" />
                          Novo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-teal-200 font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(product.price)}
                    </TableCell>
                    <TableCell className="text-teal-100">
                      {product.category?.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEdit(product.id)}
                          size="sm"
                          className="bg-teal-700 hover:bg-teal-600 text-teal-50 border-none"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(product.id)}
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de edição de produto (similar ao adicionar, mas com dados pré-preenchidos) */}
      {selectedProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-teal-900 border-teal-700 text-teal-50 rounded-xl shadow-xl max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-teal-50">Editar Produto</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-name" className="text-sm font-medium text-teal-200">
                      Nome do Produto
                    </label>
                    <Input
                      id="edit-name"
                      name="name"
                      value={selectedProduct.name}
                      onChange={handleEditInputChange}
                      className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="edit-price" className="text-sm font-medium text-teal-200">
                      Preço
                    </label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      value={selectedProduct.price}
                      onChange={handleEditInputChange}
                      className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="edit-description" className="text-sm font-medium text-teal-200">
                    Descrição
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={selectedProduct.description || ""}
                    onChange={handleEditInputChange as any}
                    rows={3}
                    className="resize-none bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600 rounded-md px-3 py-2"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-category" className="text-sm font-medium text-teal-200">
                      Categoria
                    </label>
                    <select
                      id="edit-category"
                      name="category_id"
                      value={selectedProduct.category_id || ""}
                      onChange={handleEditInputChange as any}
                      className="bg-teal-800/50 border-teal-700 text-teal-50 focus:border-teal-600 rounded-md px-3 py-2"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Ocultar campo de subcategoria para categorias sem subcategorias */}
                  {selectedProduct && !['5', '6'].includes(selectedProduct.category_id || '') && (
                    <div className="grid gap-2">
                      <label htmlFor="edit-subcategory" className="text-sm font-medium text-teal-200">
                        Subcategoria
                      </label>
                      <select
                        id="edit-subcategory"
                        name="subcategory_id"
                        value={selectedProduct.subcategory_id || ""}
                        onChange={handleEditInputChange as any}
                        className="bg-teal-800/50 border-teal-700 text-teal-50 focus:border-teal-600 rounded-md px-3 py-2"
                      >
                        <option value="">Selecione uma subcategoria</option>
                        {editSubcategories.map(subcategory => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-teal-200">
                    Imagens do Produto
                  </label>
                  
                  {loadingImages ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {productImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {productImages.map((image) => (
                            <div key={image.id} className="relative border border-teal-700 rounded-md overflow-hidden group h-28">
                              <img
                                src={getCorrectImageUrl(image.storage_path)}
                                alt={image.alt_text || selectedProduct.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                                }}
                              />
                              <div className="absolute inset-0 bg-teal-900/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!image.is_primary && (
                                  <Button
                                    size="sm"
                                    className="bg-teal-600 hover:bg-teal-500 text-white"
                                    onClick={() => handleSetPrimaryImage(image.id)}
                                  >
                                    Principal
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteImage(image.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {image.is_primary && (
                                <div className="absolute top-0 left-0 bg-teal-600 text-white text-xs px-2 py-1 rounded-br-md">
                                  Principal
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4 border border-dashed border-teal-700 rounded-md bg-teal-800/30">
                          <p className="text-teal-200">Nenhuma imagem disponível</p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium text-teal-200 mb-2">Adicionar Novas Imagens</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[0, 1, 2].map((index) => (
                            <div 
                              key={index}
                              className="border border-dashed border-teal-700 rounded-md p-2 flex flex-col items-center justify-center bg-teal-800/20 h-24 hover:bg-teal-800/40 transition-colors cursor-pointer"
                              onClick={() => document.getElementById(`file-${index}`)?.click()}
                            >
                              <input
                                id={`file-${index}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleMultipleFileChange(index)}
                              />
                              {selectedFiles[index] ? (
                                <div className="text-xs text-teal-300 text-center">
                                  {selectedFiles[index]?.name}
                                </div>
                              ) : (
                                <>
                                  <FileUp className="h-6 w-6 text-teal-400 mb-1" />
                                  <span className="text-xs text-teal-300">Upload</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="bg-transparent border-teal-600 text-teal-100 hover:bg-teal-800 hover:text-teal-50"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleUpdateProduct}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
