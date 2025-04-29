import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Search,
  Loader2,
  LayersIcon,
  Image as ImageIcon,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, Category } from "@/hooks/useCategories";
import { useSiteImages, IMAGE_TYPES, SiteImage } from "@/hooks/useSiteImages";
import { S3ImageUpload } from "@/components/ui/S3ImageUpload";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

export default function CategoryManagement() {
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  // Hook para gerenciar imagens de categoria
  const { 
    images: categoryImages, 
    loading: imagesLoading, 
    createImage, 
    updateImage, 
    deleteImage 
  } = useSiteImages({ type: IMAGE_TYPES.CATEGORY });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAddSubcategoryDialogOpen, setIsAddSubcategoryDialogOpen] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
    category_id: ""
  });
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  const [isEditSubcategoryDialogOpen, setIsEditSubcategoryDialogOpen] = useState(false);
  
  // Novos estados para gerenciamento de imagens
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedCategoryForImage, setSelectedCategoryForImage] = useState<Category | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedImagePath, setUploadedImagePath] = useState<string>("");

  // Filtrar categorias baseado na busca
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manipular mudanças nos inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedCategory(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubcategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSubcategory(prev => ({ ...prev, [name]: value }));
  };

  // Adicionar nova categoria
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          { name: newCategory.name, description: newCategory.description }
        ])
        .select();

      if (error) throw error;

      toast.success("Categoria adicionada com sucesso");
      setNewCategory({ name: "", description: "" });
      setIsAddDialogOpen(false);
      
      // Atualizar a lista de categorias
      fetchCategories();
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast.error("Erro ao adicionar categoria");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adicionar nova subcategoria
  const handleAddSubcategory = async () => {
    if (!newSubcategory.name || !newSubcategory.category_id) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert([
          { 
            name: newSubcategory.name,
            category_id: newSubcategory.category_id
          }
        ])
        .select();

      if (error) throw error;

      toast.success("Subcategoria adicionada com sucesso");
      setNewSubcategory({ name: "", category_id: "" });
      setIsAddSubcategoryDialogOpen(false);
      
      // Atualizar os dados sem recarregar a página
      fetchCategories();
    } catch (error) {
      console.error("Erro ao adicionar subcategoria:", error);
      toast.error("Erro ao adicionar subcategoria");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar categoria existente
  const handleUpdateCategory = async () => {
    if (!selectedCategory || !selectedCategory.name) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: selectedCategory.name, description: selectedCategory.description })
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast.success("Categoria atualizada com sucesso");
      setIsEditDialogOpen(false);
      
      // Atualizar a lista de categorias
      fetchCategories();
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Erro ao atualizar categoria");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Isso também excluirá todas as subcategorias associadas e pode afetar produtos existentes.")) {
      return;
    }

    try {
      // Primeiro excluir subcategorias associadas
      const { error: subcatError } = await supabase
        .from('subcategories')
        .delete()
        .eq('category_id', id);

      if (subcatError) throw subcatError;

      // Depois excluir a categoria
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Categoria excluída com sucesso");
      
      // Atualizar a lista de categorias
      fetchCategories();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria. Verifique se não há produtos usando esta categoria.");
    }
  };

  // Excluir subcategoria
  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta subcategoria? Isso pode afetar produtos existentes.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Subcategoria excluída com sucesso");
      
      // Atualizar a lista de categorias
      fetchCategories();
    } catch (error) {
      console.error("Erro ao excluir subcategoria:", error);
      toast.error("Erro ao excluir subcategoria. Verifique se não há produtos usando esta subcategoria.");
    }
  };

  // Editar categoria
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  // Preparar para adicionar subcategoria
  const handleAddSubcategoryToCategory = (categoryId: string) => {
    setNewSubcategory({ name: "", category_id: categoryId });
    setIsAddSubcategoryDialogOpen(true);
  };

  // Funções para gerenciar imagens de categoria
  const handleOpenImageDialog = (category: Category) => {
    setSelectedCategoryForImage(category);
    
    // Buscar imagem existente se houver
    const existingImage = categoryImages.find(img => img.reference_id === category.id);
    
    if (existingImage) {
      setUploadedImageUrl(existingImage.image_url || "");
      setUploadedImagePath(existingImage.image_path || "");
    } else {
      setUploadedImageUrl("");
      setUploadedImagePath("");
    }
    
    setIsImageDialogOpen(true);
  };

  const handleImageUploadSuccess = (imageUrl: string) => {
    // Extrair o caminho da URL
    const pathMatch = imageUrl.match(/\/([^/]+\/[^/]+\.[^/]+)$/);
    const imagePath = pathMatch ? pathMatch[1] : "";
    
    setUploadedImageUrl(imageUrl);
    setUploadedImagePath(imagePath);
  };

  const handleSaveImage = async () => {
    if (!selectedCategoryForImage || !uploadedImageUrl || !uploadedImagePath) {
      toast.error("Selecione uma categoria e faça upload de uma imagem");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Verificar se já existe uma imagem para esta categoria
      const existingImage = categoryImages.find(img => img.reference_id === selectedCategoryForImage.id);
      
      if (existingImage) {
        // Atualizar imagem existente
        await updateImage(existingImage.id, {
          image_url: uploadedImageUrl,
          image_path: uploadedImagePath,
          title: selectedCategoryForImage.name,
          link: `/categorias/${selectedCategoryForImage.id}`,
          active: true
        });
      } else {
        // Criar nova imagem
        await createImage({
          type: IMAGE_TYPES.CATEGORY,
          reference_id: selectedCategoryForImage.id,
          image_url: uploadedImageUrl,
          image_path: uploadedImagePath,
          title: selectedCategoryForImage.name,
          link: `/categorias/${selectedCategoryForImage.id}`,
          active: true
        });
      }
      
      toast.success("Imagem da categoria salva com sucesso");
      setIsImageDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar imagem da categoria:", error);
      toast.error("Erro ao salvar imagem da categoria");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategoryImage = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja remover a imagem desta categoria?")) {
      return;
    }

    try {
      const existingImage = categoryImages.find(img => img.reference_id === categoryId);
      
      if (existingImage) {
        await deleteImage(existingImage.id);
        toast.success("Imagem da categoria removida com sucesso");
      }
    } catch (error) {
      console.error("Erro ao excluir imagem da categoria:", error);
      toast.error("Erro ao excluir imagem da categoria");
    }
  };

  // Verificar se uma categoria tem imagem
  const getCategoryImage = (categoryId: string): SiteImage | undefined => {
    return categoryImages.find(img => img.reference_id === categoryId);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-teal-50">Gerenciamento de Categorias</h1>
          <p className="text-teal-100/85">
            Adicione, edite e organize as categorias de produtos.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md rounded-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name">Nome da Categoria</label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Camisetas"
                    value={newCategory.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description">Descrição (opcional)</label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Descreva brevemente esta categoria"
                    value={newCategory.description || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddCategory}
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Categoria"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Link to="/" target="_blank">
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Visualizar Site
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar categorias..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {categoriesLoading || imagesLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="bg-white/5 rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Subcategorias</TableHead>
                <TableHead>Imagem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    <LayersIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhuma categoria encontrada</p>
                    {searchQuery && (
                      <p className="text-sm mt-1">Tente ajustar sua busca</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => {
                  const categoryImage = getCategoryImage(category.id);
                  
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                          {category.subcategories && category.subcategories.length > 0 ? (
                            category.subcategories.map((sub) => (
                        <span 
                                key={sub.id}
                                className="bg-teal-950/30 text-teal-300 text-xs rounded-full px-2 py-1"
                        >
                                {sub.name}
                        </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">Nenhuma subcategoria</span>
                          )}
                    </div>
                  </TableCell>
                  <TableCell>
                        {categoryImage ? (
                          <div className="relative group">
                            <img 
                              src={categoryImage.image_url} 
                              alt={category.name} 
                              className="h-12 w-20 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                      <Button
                        size="sm"
                                variant="ghost"
                                className="text-white h-8 w-8 p-0"
                                onClick={() => handleOpenImageDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                                variant="ghost"
                                className="text-white h-8 w-8 p-0"
                                onClick={() => handleDeleteCategoryImage(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            className="text-teal-500 hover:text-teal-400"
                            onClick={() => handleOpenImageDialog(category)}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSubcategoryToCategory(category.id)}>
                              <Plus className="mr-2 h-4 w-4" />
                              <span>Adicionar Subcategoria</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenImageDialog(category)}>
                              <ImageIcon className="mr-2 h-4 w-4" />
                              <span>Gerenciar Imagem</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                  </TableCell>
                </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo de edição de categoria */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name">Nome da Categoria</label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Ex: Camisetas"
                value={selectedCategory?.name || ""}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description">Descrição (opcional)</label>
              <Input
                id="edit-description"
                name="description"
                placeholder="Descreva brevemente esta categoria"
                value={selectedCategory?.description || ""}
                onChange={handleEditInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para adicionar subcategoria */}
      <Dialog open={isAddSubcategoryDialogOpen} onOpenChange={setIsAddSubcategoryDialogOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Adicionar Subcategoria</DialogTitle>
            </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subcategory-name">Nome da Subcategoria</label>
                <Input
                id="subcategory-name"
                name="name"
                placeholder="Ex: Manga Longa"
                value={newSubcategory.name}
                onChange={handleSubcategoryInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
              onClick={() => setIsAddSubcategoryDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
              onClick={handleAddSubcategory}
                disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSubmitting ? (
                  <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                  </>
                ) : (
                "Adicionar Subcategoria"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Diálogo para gerenciar imagens de categoria */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>
              Gerenciar Imagem da Categoria: {selectedCategoryForImage?.name}
            </DialogTitle>
            </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-6 grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Upload de Imagem</h3>
                <S3ImageUpload 
                  onSuccess={handleImageUploadSuccess}
                  buttonText="Selecionar Imagem"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos aceitos: JPG, PNG, WebP. Tamanho máximo: 5MB.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Pré-visualização</h3>
                {uploadedImageUrl ? (
                  <div className="border rounded-md p-2 h-48 flex items-center justify-center bg-gray-50">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Pré-visualização" 
                      className="max-h-44 max-w-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="border rounded-md p-2 h-48 flex items-center justify-center bg-gray-50">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhuma imagem selecionada</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Esta imagem será exibida na página principal da loja e nas listagens de categorias.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
              onClick={() => setIsImageDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
              onClick={handleSaveImage}
              disabled={isSubmitting || !uploadedImageUrl}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSubmitting ? (
                  <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                  </>
                ) : (
                "Salvar Imagem"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </AdminLayout>
  );
} 