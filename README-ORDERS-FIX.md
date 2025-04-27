# Correção para Visualização de Pedidos

Este documento contém instruções para corrigir o problema de visualização de pedidos na área administrativa.

## Problema Identificado

Foi identificado que os pedidos são criados corretamente no banco de dados quando um cliente finaliza uma compra, mas não estão aparecendo na área administrativa. Isso ocorre devido a um problema nas políticas de segurança (Row Level Security) no Supabase.

## Solução

Foram feitas duas correções:

1. **Modificação no código**:
   - Ajustado o arquivo `src/pages/Cart.tsx` para usar o hook `useOrders` ao criar pedidos, garantindo que eles sejam criados corretamente
   - Adicionados logs detalhados no hook `useOrders` para diagnóstico

2. **Atualização das políticas de segurança**:
   - Foi criado um script `update-order-policies.js` que ajusta as políticas de segurança no Supabase

## Como executar a correção

Execute o script para atualizar as políticas de segurança. Este script requer acesso administrativo ao Supabase.

1. Certifique-se de que as variáveis de ambiente estão configuradas:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_SERVICE_KEY` ou `SUPABASE_KEY`: Chave de serviço (admin) do Supabase

2. Execute o script:
   ```
   node update-order-policies.js
   ```

3. Reinicie a aplicação:
   ```
   npm run dev
   ```

4. Faça login na área administrativa e verifique se os pedidos agora aparecem corretamente.

## Análise técnica

O problema ocorria porque as políticas de segurança no Supabase estavam configuradas incorretamente:

1. A política "Administradores têm acesso total" estava configurada para todas as operações (`FOR ALL`), mas para ser efetiva para seleção de dados, uma política específica `FOR SELECT` também é necessária em alguns casos.

2. O método de inserção no carrinho não estava usando as credenciais de autenticação apropriadas ou não tinha acesso ao contexto do usuário autenticado.

Após estas correções, os administradores poderão visualizar todos os pedidos na área administrativa. 