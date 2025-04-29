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
      },
      products: {
        Row: {
          id: string
          name: string
          description?: string
          price: number
          category_id?: string
          image_url?: string
          stock_quantity?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string
          price: number
          category_id?: string
          image_url?: string
          stock_quantity?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category_id?: string
          image_url?: string
          stock_quantity?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      // Adicione outras tabelas conforme necessário
    }
  }
} 