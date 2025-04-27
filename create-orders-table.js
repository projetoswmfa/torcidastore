const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Criar cliente Supabase usando variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL || "https://ddydxrtqzmseqqsgvwml.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function createOrdersTable() {
  try {
    console.log('Iniciando criação da tabela orders...');

    // Verificar se a tabela já existe
    const { data: existingTables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'orders');

    if (tableError) {
      console.error('Erro ao verificar tabelas existentes:', tableError);
      return;
    }

    if (existingTables && existingTables.length > 0) {
      console.log('A tabela orders já existe. Pulando criação.');
      return;
    }

    // Criar a tabela orders via SQL
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE public.orders (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer TEXT NOT NULL,
          customer_address TEXT NOT NULL,
          customer_cep TEXT NOT NULL,
          customer_whatsapp TEXT NOT NULL,
          items JSONB NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          status TEXT NOT NULL DEFAULT 'Processando',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Adicionar permissões para usuários autenticados
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

        -- Política para administradores (acesso total)
        CREATE POLICY "Administradores têm acesso total" ON public.orders
          FOR ALL 
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
            )
          );

        -- Política para anônimos (apenas inserção)
        CREATE POLICY "Anônimos podem inserir" ON public.orders
          FOR INSERT
          TO anon
          WITH CHECK (true);

        -- Adicionar trigger para atualização do campo updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
      `
    });

    if (error) {
      console.error('Erro ao criar tabela orders:', error);
      return;
    }

    console.log('Tabela orders criada com sucesso!');
  } catch (err) {
    console.error('Erro durante a criação da tabela orders:', err);
  }
}

// Executar a função
createOrdersTable()
  .then(() => {
    console.log('Script finalizado.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
  }); 