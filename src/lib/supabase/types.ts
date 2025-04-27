export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total_amount: number
          shipping_address: any
          payment_info?: any
          notes?: string
          created_at: string
          updated_at: string
          customer?: string
          customer_address?: string
          customer_cep?: string
          customer_whatsapp?: string
          items?: any
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          total_amount: number
          shipping_address: any
          payment_info?: any
          notes?: string
          created_at?: string
          updated_at?: string
          customer?: string
          customer_address?: string
          customer_cep?: string
          customer_whatsapp?: string
          items?: any
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          total_amount?: number
          shipping_address?: any
          payment_info?: any
          notes?: string
          created_at?: string
          updated_at?: string
          customer?: string
          customer_address?: string
          customer_cep?: string
          customer_whatsapp?: string
          items?: any
        }
      }
      // Adicione outras tabelas conforme necessário
    }
  }
} 