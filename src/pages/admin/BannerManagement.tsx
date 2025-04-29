import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Plus, 
  Pencil, 
  Trash2,
  Search,
  Loader2,
  FileUp,
  X,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useSiteImages, SiteImage, IMAGE_TYPES } from "@/hooks/useSiteImages";
import { S3ImageUpload } from "@/components/ui/S3ImageUpload";
import { v4 as uuidv4 } from 'uuid';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Schema para validação do formulário
const bannerFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  link: z.string().optional(),
  categoryId: z.string().optional(),
  active: z.boolean().default(true),
  image_url: z.string().min(1, "Imagem é obrigatória"),
  image_path: z.string().min(1, "Caminho da imagem é obrigatório"),
});

// Função para criar um slug a partir do nome da categoria
const createCategorySlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

export default function BannerManagement() {
  // Estado dos banners
  const { 
    images: banners, 
    loading, 
    error, 
    fetchImages: fetchBanners, 
    createImage: createBanner, 
    updateImage: updateBanner, 
    deleteImage: deleteBanner,
    reorderImages: reorderBanners
  } = useSiteImages({ type: IMAGE_TYPES.BANNER });

  // Obter categorias para o seletor
  const { categories, loading: categoriesLoading } = useCategories();

  // Estados para controle da UI
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBanner, setEditingBanner] = useState<SiteImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Configuração do formulário com React Hook Form e Zod
  const form = useForm<z.infer<typeof bannerFormSchema>>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
      categoryId: "",
      active: true,
      image_url: "",
      image_path: "",
    },
  });

  // Resetar o formulário quando o banner em edição mudar
  useEffect(() => {
    if (editingBanner) {
      // Se o link começa com /categoria/, tentar detectar a categoria selecionada
      let categoryId = "none";
      if (editingBanner.link?.startsWith("/categoria/")) {
        const slug = editingBanner.link.replace("/categoria/", "");
        const category = categories.find(c => createCategorySlug(c.name) === slug);
        if (category) {
          categoryId = category.id;
        }
      }

      form.reset({
        title: editingBanner.title || "",
        description: editingBanner.description || "",
        link: editingBanner.link || "",
        categoryId: categoryId,
        active: editingBanner.active,
        image_url: editingBanner.image_url || "",
        image_path: editingBanner.image_path || "",
      });
      setSelectedCategoryId(categoryId);
    } else {
      form.reset({
        title: "",
        description: "",
        link: "",
        categoryId: "none",
        active: true,
        image_url: "",
        image_path: "",
      });
      setSelectedCategoryId("none");
    }
  }, [editingBanner, form, categories]);

  // Função para abrir o diálogo em modo de edição
  const handleEdit = (banner: SiteImage) => {
    setEditingBanner(banner);
    setDialogOpen(true);
  };

  // Função para abrir o diálogo em modo de criação
  const handleCreate = () => {
    setEditingBanner(null);
    setDialogOpen(true);
  };

  // Função para salvar o banner (criar ou atualizar)
  const onSubmit = async (values: z.infer<typeof bannerFormSchema>) => {
    try {
      setIsSubmitting(true);

      // Determinar o link com base na categoria selecionada
      let link = values.link || "";
      
      if (values.categoryId && values.categoryId !== "none") {
        const category = categories.find(c => c.id === values.categoryId);
        if (category) {
          link = `/categoria/${createCategorySlug(category.name)}`;
        }
      }

      // Remover o campo categoryId que não existe na tabela site_images
      const { categoryId, ...dataWithoutCategoryId } = values;
      
      const dataToSave = {
        ...dataWithoutCategoryId,
        link,
        type: IMAGE_TYPES.BANNER,
      };

      if (editingBanner) {
        // Atualizar banner existente
        await updateBanner(editingBanner.id, dataToSave);
        toast.success("Banner atualizado com sucesso!");
      } else {
        // Criar novo banner
        await createBanner(dataToSave);
        toast.success("Banner criado com sucesso!");
      }

      // Fechar o diálogo e resetar o formulário
      setDialogOpen(false);
      form.reset();
      setEditingBanner(null);

    } catch (error) {
      toast.error("Erro ao salvar o banner.");
      console.error("Erro ao salvar banner:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir um banner
  const handleDelete = async (banner: SiteImage) => {
    if (window.confirm(`Tem certeza que deseja excluir o banner "${banner.title || 'sem título'}"?`)) {
      try {
        await deleteBanner(banner.id);
        toast.success("Banner excluído com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir o banner.");
        console.error("Erro ao excluir banner:", error);
      }
    }
  };

  // Função para reordenar banners (mover para cima)
  const moveUp = async (index: number) => {
    if (index <= 0) return;
    
    const newOrder = [...banners];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    
    try {
      await reorderBanners(newOrder.map(b => b.id));
    } catch (error) {
      toast.error("Erro ao reordenar banners.");
      console.error("Erro ao reordenar banners:", error);
    }
  };

  // Função para reordenar banners (mover para baixo)
  const moveDown = async (index: number) => {
    if (index >= banners.length - 1) return;
    
    const newOrder = [...banners];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    try {
      await reorderBanners(newOrder.map(b => b.id));
    } catch (error) {
      toast.error("Erro ao reordenar banners.");
      console.error("Erro ao reordenar banners:", error);
    }
  };

  // Filtrar banners com base na pesquisa
  const filteredBanners = banners.filter(
    (banner) => 
      banner.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      banner.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Função para exibir o nome da categoria a partir do link
  const getCategoryNameFromLink = (link: string | undefined) => {
    if (!link || !link.startsWith("/categoria/")) return "";
    
    const slug = link.replace("/categoria/", "");
    const category = categories.find(c => createCategorySlug(c.name) === slug);
    
    return category ? category.name : slug;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Banners</h1>
          
          <Button 
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Banner
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search" 
              placeholder="Buscar banners..." 
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Link to="/" target="_blank">
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Visualizar Site
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {filteredBanners.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-background/50">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">Nenhum banner encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery 
                    ? "Nenhum banner corresponde à sua pesquisa." 
                    : "Comece adicionando seu primeiro banner."}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={handleCreate}
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Banner
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Posição</TableHead>
                      <TableHead className="w-[80px]">Imagem</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Link/Categoria</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[150px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBanners.map((banner, index) => (
                      <TableRow key={banner.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col items-center gap-1">
                            <span>{index + 1}</span>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => moveUp(index)}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => moveDown(index)}
                                disabled={index === filteredBanners.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {banner.image_url ? (
                            <div className="h-10 w-16 rounded overflow-hidden">
                              <img 
                                src={banner.image_url} 
                                alt={banner.title || "Banner"} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{banner.title || "Sem título"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {banner.link?.startsWith("/categoria/") ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              Categoria: {getCategoryNameFromLink(banner.link)}
                            </span>
                          ) : banner.link ? (
                            <a 
                              href={banner.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate block"
                            >
                              {banner.link}
                            </a>
                          ) : (
                            <span className="text-gray-500 italic">Sem link</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            banner.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {banner.active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(banner)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(banner)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diálogo para adicionar/editar banner */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Editar Banner" : "Novo Banner"}
            </DialogTitle>
            <DialogDescription>
              {editingBanner 
                ? "Atualize as informações do banner existente" 
                : "Preencha as informações para criar um novo banner"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 col-span-1">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Novos Lançamentos" {...field} />
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
                            placeholder="Ex: Confira os novos produtos disponíveis" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Redirecionamento</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedCategoryId(value);
                                // Se uma categoria for selecionada, remover qualquer link personalizado
                                if (value && value !== "none") {
                                  form.setValue("link", "");
                                }
                              }}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">
                                  <em>Nenhuma categoria (usar link personalizado)</em>
                                </SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Selecione uma categoria para onde o banner irá redirecionar
                            </FormDescription>
                            {field.value && field.value !== "none" && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Link: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">/categoria/{categories.find(c => c.id === field.value)?.name.toLowerCase().replace(/\s+/g, '-')}</code>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(!selectedCategoryId || selectedCategoryId === "none") && (
                        <FormField
                          control={form.control}
                          name="link"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Link Personalizado (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: /promocoes" {...field} />
                              </FormControl>
                              <FormDescription>
                                Link personalizado para onde o banner irá redirecionar. Deixe em branco se não quiser nenhum redirecionamento.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Banner Ativo</FormLabel>
                          <FormDescription>
                            Banner será exibido no site quando ativo
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center justify-center h-full">
                        <FormLabel className="w-full">Imagem do Banner</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center">
                            {field.value ? (
                              <div className="relative mb-4 w-full">
                                <img 
                                  src={field.value} 
                                  alt="Preview" 
                                  className="max-h-[200px] w-full object-cover rounded-md" 
                                />
                                <Button
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full p-0"
                                  variant="destructive"
                                  type="button"
                                  onClick={() => {
                                    field.onChange("");
                                    form.setValue("image_path", "");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <S3ImageUpload
                                buttonText="Selecionar Imagem"
                                onSuccess={(imageUrl) => {
                                  // Extrair o image_path da URL
                                  const urlParts = imageUrl.split('/');
                                  const imageKey = urlParts.slice(3).join('/');
                                  
                                  // Atualizar ambos os campos
                                  field.onChange(imageUrl);
                                  form.setValue("image_path", imageKey);
                                }}
                              />
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-center mt-2">
                          Recomendado: 1920x500 pixels
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Campo oculto para image_path */}
                  <FormField
                    control={form.control}
                    name="image_path"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingBanner ? "Salvar Alterações" : "Adicionar Banner"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 