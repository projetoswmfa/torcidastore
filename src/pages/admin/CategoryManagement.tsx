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
  LayersIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, Category } from "@/hooks/useCategories";

export default function CategoryManagement() {
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
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
            <DialogContent className="bg-teal-900 border-teal-700 text-teal-50 rounded-xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-teal-50">Adicionar Nova Categoria</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-teal-200">
                    Nome da Categoria
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={newCategory.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Camisas de Futebol"
                    className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium text-teal-200">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newCategory.description || ""}
                    onChange={handleInputChange as any}
                    placeholder="Descreva a categoria"
                    rows={3}
                    className="resize-none bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600 rounded-md px-3 py-2"
                  />
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
                  onClick={handleAddCategory}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Adicionar Categoria'
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
            placeholder="Buscar categorias por nome..."
            className="pl-10 bg-teal-800/30 border-teal-700 text-teal-50 placeholder:text-teal-400/70 focus:border-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {categoriesLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <span className="ml-2 text-lg text-teal-100">Carregando categorias...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-[#E8F1F2]/30">
          <LayersIcon className="h-12 w-12 mx-auto text-[#006494]/40 mb-4" />
          <h3 className="text-lg font-medium mb-2 text-[#13293D]">Nenhuma categoria encontrada</h3>
          <p className="text-[#13293D]/85 mb-4">
            Comece adicionando sua primeira categoria usando o botão acima.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-teal-700 overflow-hidden bg-teal-800/30 shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-800/50">
                <TableHead className="text-teal-50 font-medium">Nome</TableHead>
                <TableHead className="text-teal-50 font-medium">Descrição</TableHead>
                <TableHead className="text-teal-50 font-medium">Subcategorias</TableHead>
                <TableHead className="text-teal-50 font-medium">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className="hover:bg-teal-700/30 transition-colors border-b border-teal-700/30">
                  <TableCell className="font-medium text-teal-100">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-teal-200">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {category.subcategories?.map((subcategory) => (
                        <span 
                          key={subcategory.id}
                          className="inline-flex items-center rounded-full bg-teal-700/50 px-2 py-1 text-xs font-medium text-teal-100"
                        >
                          {subcategory.name}
                        </span>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCategory(category);
                          setNewSubcategory({
                            name: "",
                            category_id: category.id
                          });
                          setIsAddSubcategoryDialogOpen(true);
                        }}
                        className="rounded-full h-6 px-2 text-xs bg-transparent border-teal-600 text-teal-100 hover:bg-teal-700/40"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsEditDialogOpen(true);
                        }}
                        size="sm"
                        className="bg-teal-700 hover:bg-teal-600 text-teal-50 border-none"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(category.id)}
                        size="sm"
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de adicionar subcategoria */}
      <Dialog open={isAddSubcategoryDialogOpen} onOpenChange={setIsAddSubcategoryDialogOpen}>
        <DialogContent className="bg-teal-900 border-teal-700 text-teal-50 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-teal-50">
              Adicionar Subcategoria 
              {selectedCategory && ` em ${selectedCategory.name}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="subcat-name" className="text-sm font-medium text-teal-200">
                Nome da Subcategoria
              </label>
              <Input
                id="subcat-name"
                value={newSubcategory.name}
                onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                placeholder="Ex: Camisas Masculinas"
                className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddSubcategoryDialogOpen(false)}
              className="bg-transparent border-teal-600 text-teal-100 hover:bg-teal-800 hover:text-teal-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddSubcategory}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Adicionar Subcategoria'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de categoria */}
      {selectedCategory && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-teal-900 border-teal-700 text-teal-50 rounded-xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-teal-50">Editar Categoria</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium text-teal-200">
                  Nome da Categoria
                </label>
                <Input
                  id="edit-name"
                  value={selectedCategory.name}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                  className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="edit-desc" className="text-sm font-medium text-teal-200">
                  Descrição
                </label>
                <textarea
                  id="edit-desc"
                  value={selectedCategory.description || ""}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, description: e.target.value })}
                  rows={3}
                  className="resize-none bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600 rounded-md px-3 py-2"
                />
              </div>
              
              {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-teal-200">
                    Subcategorias
                  </label>
                  <div className="space-y-2 p-3 rounded-md bg-teal-800/20 border border-teal-700/50">
                    {selectedCategory.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="flex justify-between items-center p-2 rounded-md bg-teal-700/30 hover:bg-teal-700/50 transition-colors">
                        <span className="text-teal-100">{subcategory.name}</span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSubcategory(subcategory);
                              setIsEditSubcategoryDialogOpen(true);
                            }}
                            className="h-8 w-8 rounded-full p-0 text-teal-200 hover:text-teal-50 hover:bg-teal-600/50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            className="h-8 w-8 rounded-full p-0 text-red-300 hover:text-red-100 hover:bg-red-600/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                onClick={handleUpdateCategory}
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

      {/* Modal de edição de subcategoria */}
      {selectedSubcategory && (
        <Dialog open={isEditSubcategoryDialogOpen} onOpenChange={setIsEditSubcategoryDialogOpen}>
          <DialogContent className="bg-teal-900 border-teal-700 text-teal-50 rounded-xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-teal-50">Editar Subcategoria</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-subcat-name" className="text-sm font-medium text-teal-200">
                  Nome da Subcategoria
                </label>
                <Input
                  id="edit-subcat-name"
                  value={selectedSubcategory.name}
                  onChange={(e) => setSelectedSubcategory({ ...selectedSubcategory, name: e.target.value })}
                  className="bg-teal-800/50 border-teal-700 text-teal-50 placeholder:text-teal-400/50 focus:border-teal-600"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditSubcategoryDialogOpen(false)}
                className="bg-transparent border-teal-600 text-teal-100 hover:bg-teal-800 hover:text-teal-50"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddSubcategory}
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