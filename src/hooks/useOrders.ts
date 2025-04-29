import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from '@/lib/supabase/types';

type OrderTableRow = Database['public']['Tables']['orders']['Row'];
type OrderTableInsert = Database['public']['Tables']['orders']['Insert'];

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  customization?: {
    name: string;
    number: string;
  };
}

export interface Order extends OrderTableRow {
  items: OrderItem[];
}

// Interface para a criação de pedidos na aplicação (formato frontend)
export interface OrderInput {
  customer: string;
  customer_address: string;
  customer_cep: string;
  customer_whatsapp: string;
  items: OrderItem[];
  total: number;
}

// Valores de status permitidos pelo banco de dados
export type OrderStatus = 'pending' | 'completed';

// Para visualização no frontend, mapeamento de status do banco para português
export const orderStatusTranslation = {
  'pending': 'Pendente',
  'completed': 'Concluído'
};

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = async () => {
    try {
      console.log('Iniciando busca de pedidos...');
      setLoading(true);
      setError(null);
      
      // Verificar sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
      } else {
        console.log('Sessão atual:', sessionData.session ? 
          `Autenticado como ${sessionData.session.user.email} (${sessionData.session.user.id})` : 
          'Não autenticado');
      }
      
      // Verificar se o usuário é admin
      if (sessionData.session) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', sessionData.session.user.id);
        
        if (roleError) {
          console.error('Erro ao verificar roles:', roleError);
        } else {
          const isAdmin = roleData && roleData.some(r => r.role === 'admin');
          console.log('Usuário tem papel de admin:', isAdmin, roleData);
        }
      }
      
      console.log('Executando consulta de pedidos...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro na consulta de pedidos:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast.error(`Erro ao buscar pedidos: ${error.message}`);
        throw error;
      }

      console.log('Pedidos recuperados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Amostra do primeiro pedido:', {
          id: data[0].id,
          customer: data[0].customer,
          status: data[0].status,
          created_at: data[0].created_at
        });
      } else {
        console.log('Nenhum pedido encontrado na consulta');
      }
      
      // Converter os dados para garantir que o tipo seja Order[]
      const typedOrders = data as unknown as Order[] || [];
      
      setOrders(typedOrders);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar pedidos'));
      toast.error('Falha ao carregar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        toast.error(`Falha ao atualizar o status do pedido: ${error.message}`);
        throw error;
      }

      // Atualizar o estado localmente
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status, updated_at: new Date().toISOString() } : order
        )
      );

      toast.success(`Status do pedido atualizado para: ${orderStatusTranslation[status]}`);
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
    }
  };

  // Função para excluir um pedido
  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        toast.error(`Falha ao excluir o pedido: ${error.message}`);
        throw error;
      }

      // Atualizar o estado local removendo o pedido excluído
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );

      toast.success('Pedido excluído com sucesso');
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
      throw err;
    }
  };

  // Função para criar um novo pedido
  const createOrder = async (orderData: OrderInput) => {
    try {
      // Obter o ID do usuário atual
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) {
        toast.error('Você precisa estar logado para criar um pedido');
        throw new Error('User not authenticated');
      }

      const newOrder: OrderTableInsert = {
        user_id: userId,
        customer: orderData.customer,
        customer_address: orderData.customer_address,
        customer_cep: orderData.customer_cep,
        customer_whatsapp: orderData.customer_whatsapp,
        total_amount: orderData.total,
        items: orderData.items,
        shipping_address: { address: orderData.customer_address },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(newOrder as any)
        .select();

      if (error) {
        console.error("Erro ao criar pedido:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast.error(`Falha ao criar pedido: ${error.message}`);
        throw error;
      }

      toast.success('Pedido criado com sucesso!');
      
      // Atualizar a lista de pedidos
      await fetchOrders();
      
      return data?.[0];
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    createOrder,
    deleteOrder
  };
} 