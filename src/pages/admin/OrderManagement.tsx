import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search,
  Loader2,
  RefreshCcw,
  Eye,
  FileDown,
  Trash
} from "lucide-react";
import { useOrders, Order, OrderStatus, orderStatusTranslation } from "@/hooks/useOrders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Variável para armazenar o total de vendas concluídas
interface SalesStats {
  totalSales: number;
  totalOrders: number;
}

export default function OrderManagement() {
  const { orders, loading, fetchOrders, updateOrderStatus, deleteOrder } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalSales: 0,
    totalOrders: 0
  });

  // Carregar estatísticas iniciais
  useEffect(() => {
    fetchSalesStats();
  }, []);

  // Atualizar estatísticas quando os pedidos forem atualizados
  useEffect(() => {
    if (!loading && orders.length > 0) {
      calculateSalesStats();
    }
  }, [orders, loading]);

  // Buscar estatísticas de vendas do banco de dados
  const fetchSalesStats = async () => {
    try {
      // Buscar vendas totais de pedidos concluídos
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      if (error) {
        console.error('Erro ao buscar estatísticas de vendas:', error);
        return;
      }

      // Calcular total
      const total = data?.reduce((sum, order) => {
        const amount = typeof order.total_amount === 'string' 
          ? parseFloat(order.total_amount) 
          : order.total_amount || 0;
        return sum + amount;
      }, 0) || 0;
      
      setSalesStats({
        totalSales: total,
        totalOrders: data?.length || 0
      });
    } catch (err) {
      console.error('Erro ao processar estatísticas de vendas:', err);
    }
  };

  // Calcular estatísticas baseadas nos pedidos atuais
  const calculateSalesStats = () => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    const total = completedOrders.reduce((sum, order) => {
      const amount = typeof order.total_amount === 'string' 
        ? parseFloat(order.total_amount) 
        : order.total_amount || 0;
      return sum + amount;
    }, 0);
    
    setSalesStats({
      totalSales: total,
      totalOrders: completedOrders.length
    });
  };

  // Filtrar pedidos baseado na busca
  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      (order.customer?.toLowerCase().includes(searchLower) || "") ||
      orderStatusTranslation[order.status as OrderStatus].toLowerCase().includes(searchLower)
    );
  });

  // Função para exibir detalhes do pedido
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Função para iniciar processo de exclusão
  const handleDeleteRequest = (orderId: string) => {
    setOrderToDelete(orderId);
    setIsDeleteAlertOpen(true);
  };

  // Função para confirmar e excluir pedido
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    
    try {
      await deleteOrder(orderToDelete);
      // Recalcular estatísticas após exclusão
      calculateSalesStats();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
    } finally {
      setOrderToDelete(null);
      setIsDeleteAlertOpen(false);
    }
  };

  // Função para atualizar o status do pedido
  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    // Se o status está sendo alterado para 'completed', atualize o total de vendas
    try {
      await updateOrderStatus(orderId, status);
      
      // Atualizar estatísticas imediatamente após concluir um pedido
      if (status === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          setSalesStats(prev => ({
            totalSales: prev.totalSales + parseFloat(order.total_amount),
            totalOrders: prev.totalOrders + 1
          }));
        }
        
        toast.success('Pedido concluído! Estatísticas de vendas atualizadas.');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar o status do pedido.');
    }
  };

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formatar preço para exibição
  const formatPrice = (price: number | string | unknown) => {
    let numericPrice: number;
    
    if (typeof price === 'string') {
      numericPrice = parseFloat(price) || 0;
    } else if (typeof price === 'number') {
      numericPrice = price;
    } else {
      numericPrice = 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericPrice);
  };

  // Função para exportar pedidos para CSV
  const handleExportCSV = () => {
    // Criar cabeçalho do CSV
    const headers = ['ID', 'Cliente', 'Whatsapp', 'CEP', 'Endereço', 'Total', 'Status', 'Data Criação'];
    
    // Converter dados para formato CSV
    const csvData = filteredOrders.map(order => [
      order.id,
      order.customer,
      order.customer_whatsapp,
      order.customer_cep,
      order.customer_address,
      formatPrice(String(parseFloat(order.total_amount))),
      orderStatusTranslation[order.status as OrderStatus],
      formatDate(order.created_at)
    ]);
    
    // Juntar cabeçalho e dados
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Pedidos exportados com sucesso!');
  };

  // Renderizar cores baseadas no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-200 text-amber-800';
      case 'completed':
        return 'bg-emerald-200 text-emerald-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm opacity-80">Vendas Totais Concluídas</p>
              <p className="text-2xl font-bold">{formatPrice(salesStats.totalSales)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm opacity-80">Pedidos Concluídos</p>
              <p className="text-2xl font-bold">{salesStats.totalOrders}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-teal-50">Gerenciamento de Pedidos</h1>
          <p className="text-teal-100/85">
            Visualize e gerencie todos os pedidos da loja.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 bg-teal-700 border-teal-600 text-white hover:bg-teal-600 hover:text-white rounded-lg"
            onClick={handleExportCSV}
          >
            <FileDown className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>
          <Button 
            variant="default" 
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md rounded-lg"
            onClick={fetchOrders}
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-300" />
          <Input
            placeholder="Buscar pedidos por ID, cliente ou status..."
            className="pl-10 bg-teal-800/30 border-teal-700 text-teal-50 placeholder:text-teal-400/70 focus:border-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <span className="ml-2 text-lg text-teal-100">Carregando pedidos...</span>
        </div>
      ) : (
        <div className="rounded-xl border border-teal-700 overflow-hidden bg-teal-800/30 shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-800/50">
                <TableHead className="text-teal-50 font-medium">ID</TableHead>
                <TableHead className="text-teal-50 font-medium">Cliente</TableHead>
                <TableHead className="text-teal-50 font-medium">Data</TableHead>
                <TableHead className="text-teal-50 font-medium">Total</TableHead>
                <TableHead className="text-teal-50 font-medium">Status</TableHead>
                <TableHead className="text-teal-50 font-medium">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-teal-100/70">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-teal-700/30 transition-colors border-b border-teal-700/30">
                    <TableCell className="font-medium text-teal-200">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-teal-100">{order.customer}</TableCell>
                    <TableCell className="text-teal-100/85">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-teal-200 font-medium">
                      {formatPrice(String(order.total_amount))}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {orderStatusTranslation[order.status as OrderStatus] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          className="bg-teal-700 border-teal-600 text-teal-50 hover:bg-teal-600 hover:text-white rounded-lg flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver</span>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-teal-700 border-teal-600 text-teal-50 hover:bg-teal-600 hover:text-white rounded-lg"
                            >
                              Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-teal-800 border-teal-700 text-teal-50">
                            <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-teal-700" />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(order.id, 'pending')}
                              disabled={order.status === 'pending'}
                              className="text-amber-300 focus:text-amber-200 cursor-pointer focus:bg-teal-700"
                            >
                              Pendente
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(order.id, 'completed')}
                              disabled={order.status === 'completed'}
                              className="text-emerald-300 focus:text-emerald-200 cursor-pointer focus:bg-teal-700"
                            >
                              Concluído
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRequest(order.id)}
                          className="bg-red-700 border-red-600 text-red-50 hover:bg-red-600 hover:text-white rounded-lg flex items-center gap-1"
                        >
                          <Trash className="h-3.5 w-3.5" />
                          <span>Excluir</span>
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

      {selectedOrder && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-xl bg-teal-900 border-teal-700 text-teal-50">
            <DialogHeader>
              <DialogTitle className="text-teal-50">Detalhes do Pedido #{selectedOrder.id.slice(0, 8)}</DialogTitle>
              <DialogDescription className="text-teal-200/70">
                Informações completas sobre o pedido e seus itens.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-teal-300">Cliente</h3>
                  <p className="text-teal-100">{selectedOrder.customer}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-teal-300">WhatsApp</h3>
                  <p className="text-teal-100">{selectedOrder.customer_whatsapp}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-teal-300">Endereço</h3>
                  <p className="text-teal-100">{selectedOrder.customer_address}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-teal-300">CEP</h3>
                  <p className="text-teal-100">{selectedOrder.customer_cep}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-teal-300">Data do Pedido</h3>
                  <p className="text-teal-100">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-teal-300">Status</h3>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {orderStatusTranslation[selectedOrder.status as OrderStatus] || selectedOrder.status}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t border-teal-700 pt-4">
                <h3 className="text-sm font-medium text-teal-300 mb-2">Itens do Pedido</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-teal-800 text-teal-50">
                      <th className="text-left py-2 px-2">Produto</th>
                      <th className="text-left py-2 px-2">Tamanho</th>
                      <th className="text-left py-2 px-2">Qtd</th>
                      <th className="text-right py-2 px-2">Preço</th>
                      <th className="text-right py-2 px-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} className="border-b border-teal-700/50">
                        <td className="py-2 px-2 text-teal-100">
                          {item.name}
                          {item.customization && (
                            <div className="text-xs text-teal-300">
                              Customizado: {item.customization.name} / {item.customization.number}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-teal-100">{item.size}</td>
                        <td className="py-2 px-2 text-teal-100">{item.quantity}</td>
                        <td className="py-2 px-2 text-right text-teal-100">{formatPrice(item.price)}</td>
                        <td className="py-2 px-2 text-right text-teal-100 font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-teal-800/50">
                      <td colSpan={4} className="py-2 px-2 text-right font-medium text-teal-100">Total</td>
                      <td className="py-2 px-2 text-right font-bold text-teal-50">
                        {formatPrice(selectedOrder.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-teal-900 border-teal-700 text-teal-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
            <AlertDialogDescription className="text-teal-300">
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-teal-800 text-teal-100 hover:bg-teal-700 border-teal-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-700 text-white hover:bg-red-600"
              onClick={handleConfirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
} 