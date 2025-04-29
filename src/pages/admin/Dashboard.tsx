import React, { useEffect, useState } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShoppingBag,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ArrowRight,
  CalendarDays,
  Package,
  LineChart,
  BarChart,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";

export default function AdminDashboard() {
  console.log("AdminDashboard - Renderizando"); // Log para debug
  
  const { orders, loading: ordersLoading, fetchOrders } = useOrders();
  const { products, loading: productsLoading, fetchProducts } = useProducts();
  const [isLoading, setIsLoading] = useState(true);
  
  // Log de montagem
  useEffect(() => {
    console.log("AdminDashboard - Montado");
    
    // Quando os dados são carregados, atualizar o estado de loading
    if (!ordersLoading && !productsLoading) {
      setIsLoading(false);
    }
    
    return () => console.log("AdminDashboard - Desmontado");
  }, [ordersLoading, productsLoading]);

  // Calcular estatísticas em tempo real
  const calculateStats = () => {
    // Valor total de pedidos concluídos
    const completedOrders = orders.filter(order => order.status === 'completed');
    const completedSales = completedOrders.reduce((sum, order) => {
      const amount = typeof order.total_amount === 'string' 
        ? parseFloat(order.total_amount) 
        : order.total_amount || 0;
      return sum + amount;
    }, 0);
    
    // Valor total de pedidos pendentes
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const pendingSales = pendingOrders.reduce((sum, order) => {
      const amount = typeof order.total_amount === 'string' 
        ? parseFloat(order.total_amount) 
        : order.total_amount || 0;
      return sum + amount;
    }, 0);
    
    // Total de pedidos
    const totalOrders = orders.length;
    const pendingOrdersCount = pendingOrders.length;
    
    // Contagem de clientes únicos
    const uniqueCustomers = new Set(orders.map(order => order.customer_whatsapp)).size;
    
    // Total de produtos ativos
    const activeProducts = products.length;
    
    return [
      {
        title: "Vendas Totais",
        value: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(completedSales),
        icon: DollarSign,
        change: "+8%",
        trend: "up",
        details: "vs. mês anterior",
        chart: [10, 30, 20, 40, 35, 50, 45, 60, 55, 80], // Dados simulados para o mini-gráfico
        color: "from-teal-500 to-teal-600"
      },
      {
        title: "Vendas Concluídas",
        value: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(completedSales),
        icon: ShoppingCart,
        change: "+15%",
        trend: "up",
        details: "vs. mês anterior",
        chart: [15, 25, 35, 40, 45, 55, 50, 60, 70, 75], // Dados simulados para o mini-gráfico
        color: "from-teal-400 to-teal-500"
      },
      {
        title: "Vendas Totais Pendentes",
        value: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(pendingSales),
        icon: DollarSign,
        change: "+5%",
        trend: "up",
        details: "vs. mês anterior",
        chart: [5, 15, 10, 25, 20, 30, 25, 35, 30, 40], // Dados simulados para o mini-gráfico
        color: "from-amber-400 to-amber-500"
      },
      {
        title: "Pedidos",
        value: totalOrders.toString(),
        icon: ShoppingCart,
        change: "+18%",
        trend: "up",
        details: "vs. mês anterior",
        chart: [20, 40, 30, 50, 45, 60, 75, 70, 90, 80], // Dados simulados para o mini-gráfico
        color: "from-cyan-500 to-cyan-600"
      },
      {
        title: "Pedidos Pendentes",
        value: pendingOrdersCount.toString(),
        icon: ShoppingCart,
        change: "+10%",
        trend: "up",
        details: "vs. mês anterior",
        chart: [10, 20, 15, 25, 20, 30, 35, 30, 40, 35], // Dados simulados para o mini-gráfico
        color: "from-amber-500 to-amber-600"
      },
      {
        title: "Clientes",
        value: uniqueCustomers.toString(),
        icon: Users,
        change: "+12%",
        trend: "up",
        details: "vs. mês anterior",
        chart: [30, 40, 35, 45, 40, 50, 45, 60, 55, 65], // Dados simulados para o mini-gráfico
        color: "from-teal-300 to-cyan-400"
      },
      {
        title: "Produtos Ativos",
        value: activeProducts.toString(),
        icon: Package,
        change: "-3%",
        trend: "down",
        details: "vs. mês anterior",
        chart: [70, 65, 75, 70, 60, 65, 55, 60, 50, 55], // Dados simulados para o mini-gráfico
        color: "from-cyan-400 to-blue-400"
      },
    ];
  };

  // Calcular produtos mais vendidos
  const calculateTopProducts = () => {
    // Criar um mapa para contar quantas vezes cada produto aparece nos pedidos
    const productSalesMap = new Map();
    
    // Percorrer todos os pedidos e itens
    orders.forEach(order => {
      order.items.forEach(item => {
        const productKey = item.id;
        const currentCount = productSalesMap.get(productKey) || { 
          id: item.id,
          name: item.name,
          price: item.price,
          sales: 0,
          stock: 0, // Não temos estoque real, então deixamos como 0
          trend: "up"
        };
        
        // Incrementar vendas baseado na quantidade do item
        currentCount.sales += item.quantity;
        productSalesMap.set(productKey, currentCount);
      });
    });
    
    // Converter o mapa para array e ordenar por vendas
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    
    // Se temos menos de 5 produtos, preencher com dados estáticos
    if (topProducts.length < 5) {
      const staticProducts = [
        {
          id: "1",
          name: "Camisa Barcelona Home 2023/24",
          price: 299.90,
          sales: 15,
          stock: 45,
          trend: "up"
        },
        {
          id: "2",
          name: "Camisa Flamengo I 2023",
          price: 249.90,
          sales: 12,
          stock: 32,
          trend: "up"
        },
        {
          id: "3",
          name: "Camisa Real Madrid Away 2023/24",
          price: 279.90,
          sales: 10,
          stock: 38,
          trend: "down"
        },
        {
          id: "4",
          name: "Camisa Brasil I 2022",
          price: 269.90,
          sales: 9,
          stock: 27,
          trend: "up"
        },
        {
          id: "5",
          name: "Camisa Manchester City Home 2023/24",
          price: 289.90,
          sales: 8,
          stock: 21,
          trend: "down"
        }
      ];
      
      // Adicionar produtos estáticos que não existem no nosso top
      let i = 0;
      while (topProducts.length < 5 && i < staticProducts.length) {
        if (!topProducts.find(p => p.id === staticProducts[i].id)) {
          topProducts.push(staticProducts[i]);
        }
        i++;
      }
    }
    
    // Formatar preços
    return topProducts.map(product => ({
      ...product,
      price: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(product.price)
    }));
  };

  // Função para formatar pedidos recentes
  const formatRecentOrders = () => {
    if (orders.length === 0) {
      return [
        {
          id: "#ORD-7234",
          customer: "Pedro Almeida",
          product: "Camisa Barcelona Home 2023/24",
          date: "02/06/2023",
          status: "Entregue",
          total: "R$ 299,90"
        },
        {
          id: "#ORD-7235",
          customer: "Maria Silva",
          product: "Camisa Flamengo I 2023",
          date: "02/06/2023",
          status: "Processando",
          total: "R$ 249,90"
        },
        {
          id: "#ORD-7236",
          customer: "João Santos",
          product: "Camisa Real Madrid Away 2023/24",
          date: "01/06/2023",
          status: "Enviado",
          total: "R$ 279,90"
        },
        {
          id: "#ORD-7237",
          customer: "Ana Oliveira",
          product: "Camisa Brasil I 2022",
          date: "01/06/2023",
          status: "Entregue",
          total: "R$ 269,90"
        }
      ];
    }
    
    // Pegar os 5 pedidos mais recentes
    return orders
      .slice(0, 5)
      .map(order => {
        // Pegar o primeiro item do pedido como representativo
        const mainProduct = order.items[0];
        const totalAmount = typeof order.total_amount === 'string' 
          ? parseFloat(order.total_amount) 
          : order.total_amount || 0;
        
        return {
          id: `#${order.id.slice(0, 8)}`,
          customer: order.customer,
          product: order.items.length > 1 
            ? `${mainProduct.name} e mais ${order.items.length - 1} item(s)` 
            : mainProduct.name,
          date: new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(new Date(order.created_at)),
          status: order.status,
          total: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(totalAmount)
        };
      });
  };

  const stats = calculateStats();
  const topProducts = calculateTopProducts();
  const recentOrders = formatRecentOrders();

  const renderMiniChart = (data: number[]) => {
    const max = Math.max(...data);
    
    return (
      <div className="flex items-end gap-[2px] h-[40px]">
        {data.map((value, index) => (
          <div 
            key={index}
            className="bg-[#1B98E0]/40 rounded-sm w-[3px]"
            style={{ height: `${(value / max) * 100}%` }}
          />
        ))}
      </div>
    );
  };

  // Função para atualizar dados
  const handleRefresh = () => {
    setIsLoading(true);
    fetchOrders();
    fetchProducts();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-teal-50">Dashboard</h1>
            <p className="text-teal-100/85">
              Visão geral e estatísticas da sua loja
            </p>
          </div>
          
          <Button 
            variant="default"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            <span>Atualizar Dados</span>
          </Button>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-teal-700 shadow-md bg-teal-800/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-teal-200">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full bg-gradient-to-r ${stat.color} text-white`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-50">{stat.value}</div>
                <div className="flex items-center mt-1">
                  <div className={`text-xs font-medium flex items-center ${
                    stat.trend === "up" ? "text-emerald-300" : "text-rose-300"
                  }`}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {stat.change}
                  </div>
                  <div className="text-xs text-teal-300/70 ml-2">
                    {stat.details}
                  </div>
                </div>
                <div className="h-10 mt-3">
                  {renderMiniChart(stat.chart)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <Card className="border-teal-700 overflow-hidden shadow-lg lg:col-span-2 bg-teal-800/30 rounded-xl">
            <CardHeader className="border-b border-teal-700/50 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg text-teal-50">Visão Geral de Vendas</CardTitle>
                  <CardDescription className="text-teal-200/70">
                    Vendas mensais nos últimos 6 meses
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8 bg-teal-700 border-teal-600 text-teal-50 hover:bg-teal-600 hover:text-white rounded-lg"
                >
                  Relatórios Completos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Aqui seria um gráfico de vendas - mantido como comentário porque seria apenas visual */}
              <div className="aspect-[3/2] bg-teal-700/30 rounded-xl flex items-center justify-center">
                <BarChart className="h-12 w-12 text-teal-400/60" />
                <p className="ml-2 text-teal-200/70">Dados de vendas seriam exibidos aqui</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-700 overflow-hidden shadow-lg bg-teal-800/30 rounded-xl">
            <CardHeader className="border-b border-teal-700/50 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-teal-50">Produtos Mais Vendidos</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-8 gap-1 text-teal-200 hover:text-teal-100 hover:bg-teal-700/50 rounded-lg"
                >
                  <span>Ver Todos</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-5">
                {topProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="flex items-center justify-between group hover:bg-teal-700/30 p-2 rounded-lg transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-teal-100 truncate">{product.name}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-teal-300 font-medium">{product.price}</span>
                        <div className="mx-2 h-1 w-1 rounded-full bg-teal-600/50" />
                        <span className="text-xs text-teal-200/70">Estoque: {product.stock}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      product.trend === "up" ? "text-emerald-300" : "text-rose-300"
                    }`}>
                      {product.sales} vendas
                      {product.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-teal-700 overflow-hidden shadow-lg bg-teal-800/30 rounded-xl">
          <CardHeader className="border-b border-teal-700/50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-teal-50">Pedidos Recentes</CardTitle>
              <Link to="/admin/pedidos">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 bg-teal-700 border-teal-600 text-teal-50 hover:bg-teal-600 hover:text-white rounded-lg"
                >
                  <span>Ver Todos</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-teal-700/50">
                    <th className="text-left p-4 text-xs font-medium text-teal-200">ID</th>
                    <th className="text-left p-4 text-xs font-medium text-teal-200">Cliente</th>
                    <th className="text-left p-4 text-xs font-medium text-teal-200">Produto</th>
                    <th className="text-left p-4 text-xs font-medium text-teal-200">Data</th>
                    <th className="text-left p-4 text-xs font-medium text-teal-200">Status</th>
                    <th className="text-right p-4 text-xs font-medium text-teal-200">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-700/30">
                  {recentOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-teal-700/30 hover:bg-teal-700/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4 text-sm font-medium text-teal-300">{order.id}</td>
                      <td className="p-4 text-sm text-teal-100">{order.customer}</td>
                      <td className="p-4 text-sm text-teal-100 max-w-[200px] truncate">{order.product}</td>
                      <td className="p-4 text-sm text-teal-200/70">{order.date}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.status === 'Entregue' 
                            ? 'bg-emerald-200 text-emerald-800'
                            : order.status === 'Processando'
                              ? 'bg-amber-200 text-amber-800'
                              : order.status === 'Enviado'
                                ? 'bg-blue-200 text-blue-800'
                                : 'bg-red-200 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-teal-100 text-right">{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
