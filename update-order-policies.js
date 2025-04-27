const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Criar cliente Supabase usando variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL || "https://ddydxrtqzmseqqsgvwml.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function updateOrderPolicies() {
  try {
    console.log('Atualizando políticas de segurança da tabela orders...');

    // Primeiro, vamos verificar as políticas existentes
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT * FROM pg_policies 
        WHERE tablename = 'orders';
      `
    });

    if (policiesError) {
      console.error('Erro ao verificar políticas existentes:', policiesError);
      return;
    }

    console.log('Políticas existentes:', policies);
    
    // Deletar políticas existentes para limpar configuração
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: `
        DROP POLICY IF EXISTS "Administradores têm acesso total" ON public.orders;
        DROP POLICY IF EXISTS "Anônimos podem inserir" ON public.orders;
      `
    });

    if (dropError) {
      console.error('Erro ao deletar políticas existentes:', dropError);
      return;
    }

    console.log('Políticas antigas removidas com sucesso');

    // Criar novas políticas corrigidas
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `
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
          TO anon, authenticated
          WITH CHECK (true);

        -- Política para permitir leitura pelos administradores
        CREATE POLICY "Administradores podem ler pedidos" ON public.orders
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
            )
          );
      `
    });

    if (createError) {
      console.error('Erro ao criar novas políticas:', createError);
      return;
    }

    console.log('Novas políticas de segurança criadas com sucesso!');

    // Verificar as novas políticas
    const { data: newPolicies, error: newPoliciesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT * FROM pg_policies 
        WHERE tablename = 'orders';
      `
    });

    if (newPoliciesError) {
      console.error('Erro ao verificar novas políticas:', newPoliciesError);
      return;
    }

    console.log('Novas políticas configuradas:', newPolicies);
    console.log('Atualização concluída com sucesso!');

  } catch (err) {
    console.error('Erro durante a atualização das políticas:', err);
  }
}

// Executar a função
updateOrderPolicies()
  .then(() => {
    console.log('Script finalizado.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
  }); 