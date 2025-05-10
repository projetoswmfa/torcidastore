import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ImageUrlInput } from '../ui/ImageUrlInput';

// Schema de validação do formulário
const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  price: z.coerce.number().min(0.01, 'Preço deve ser maior que zero'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category_id: z.string().min(1, 'Selecione uma categoria'),
  subcategory_id: z.string().default(''),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Tipando o produto conforme a estrutura real do Supabase
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category_id: string;
  subcategory_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  imported_from_file: boolean;
  category?: {
    name: string;
  };
  subcategory?: {
    name: string;
  };
  images?: {
    storage_path: string;
    is_primary: boolean;
    alt_text: string | null;
  }[];
}

// Tipo para inserção de novo produto
type ProductInsert = Omit<Product, 'id'>;

// Mapeamento de categorias para exibição amigável
const categoryOptions = {
  '1': 'Times Brasileiros',
  '2': 'Internacionais',
  '3': 'Seleções',
  '4': 'Retrô',
  '5': 'Conjuntos',
  '6': 'Inverno'
};

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const isEditing = !!id;

  // Inicializar o formulário
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      description: '',
      category_id: '',
      subcategory_id: '',
    }
  });

  // Carregar dados do produto se estiver editando
  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Erro ao buscar produto:', error);
        throw error;
      }
      
      if (data) {
        const productData = data as unknown as Product;
        setProduct(productData);
        
        // Preencher o formulário com os dados do produto
        form.reset({
          name: productData.name,
          price: productData.price,
          description: productData.description || '',
          category_id: productData.category_id,
          subcategory_id: productData.subcategory_id || '',
        });
        
        // Definir a URL da imagem se existir
        if (productData.image_url) {
          setImageUrl(productData.image_url);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar produto quando o componente montar (se estiver em modo de edição)
  useEffect(() => {
    if (isEditing) {
      loadProduct(id);
    }
  }, [id, isEditing]);

  // Enviar formulário
  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      if (isEditing) {
        // Atualizar produto existente
        const updateData = {
          ...values,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
        
        // Feedback de sucesso
        alert('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto - garantindo que todos os campos obrigatórios estejam presentes
        const insertData: ProductInsert = {
          name: values.name,
          price: values.price,
          description: values.description,
          category_id: values.category_id,
          subcategory_id: values.subcategory_id,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          imported_from_file: false
        };
        
        const { data, error } = await supabase
          .from('products')
          .insert(insertData)
          .select('id')
          .single();

        if (error) throw error;
        
        // Redirecionar para a edição do produto recém-criado
        if (data?.id) {
          alert('Produto criado com sucesso!');
          navigate(`/admin/products/edit/${data.id}`);
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(`Erro ao salvar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Manipular sucesso no upload da imagem
  const handleImageUploadSuccess = (url: string) => {
    setImageUrl(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">
        {isEditing ? `Editar Produto` : 'Criar Novo Produto'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Camisa do Flamengo 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o produto..."
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Times Brasileiros</SelectItem>
                        <SelectItem value="2">Internacionais</SelectItem>
                        <SelectItem value="3">Seleções</SelectItem>
                        <SelectItem value="4">Retrô</SelectItem>
                        <SelectItem value="5">Conjuntos</SelectItem>
                        <SelectItem value="6">Inverno</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar Produto' : 'Criar Produto'}
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Imagem do Produto</h3>
          
          {imageUrl ? (
            <div className="relative mb-4">
              <img 
                src={imageUrl} 
                alt="Imagem atual" 
                className="w-full h-auto max-h-64 object-contain rounded-md border" 
              />
              <p className="mt-2 text-sm text-gray-500">Imagem atual do produto</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Este produto não possui imagem</p>
          )}
          
          <ImageUrlInput 
            initialImageUrl={imageUrl || ''}
            productId={isEditing ? id : undefined}
            onSuccess={handleImageUploadSuccess}
          />
        </div>
      </div>
    </div>
  );
} 