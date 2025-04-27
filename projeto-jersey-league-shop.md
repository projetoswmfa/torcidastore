# Jersey League Shop 🏆

## Descrição do Projeto

O Jersey League Shop é um e-commerce especializado na venda de camisas de times de futebol, oferecendo uma ampla gama de produtos de times brasileiros, europeus e seleções nacionais. A plataforma foi desenvolvida com foco em uma experiência de usuário moderna e intuitiva.

## Tecnologias Utilizadas

### Frontend
- **React**: Biblioteca JavaScript para construção de interfaces de usuário
- **TypeScript**: Superset de JavaScript com tipagem estática
- **Vite**: Ferramenta de build moderna e rápida para desenvolvimento web
- **React Router DOM**: Gerenciamento de rotas na aplicação
- **TailwindCSS**: Framework de CSS utilitário para estilização
- **shadcn/ui**: Componentes de UI reutilizáveis baseados em Radix UI
- **Radix UI**: Biblioteca de componentes acessíveis e personalizáveis
- **React Query**: Biblioteca para gerenciamento de estado e requisições
- **Zustand**: Biblioteca leve para gerenciamento de estado global
- **React Hook Form**: Biblioteca para gerenciamento de formulários
- **Zod**: Biblioteca de validação de esquemas para TypeScript

### Backend
- **Supabase**: Plataforma de backend as a service (BaaS)
  - Banco de dados PostgreSQL
  - Autenticação e autorização
  - Armazenamento de arquivos
  - Funções serverless

## Estrutura do Projeto

### Estrutura de Diretórios Principais

```
jersey-league-shop/
├── public/             # Arquivos estáticos públicos
├── src/                # Código fonte da aplicação
│   ├── components/     # Componentes reutilizáveis
│   │   ├── admin/      # Componentes da área administrativa
│   │   ├── home/       # Componentes da página inicial
│   │   ├── layout/     # Componentes de layout (header, footer, etc.)
│   │   ├── product/    # Componentes relacionados a produtos
│   │   └── ui/         # Componentes de UI genéricos (shadcn/ui)
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Integrações com serviços externos
│   │   └── supabase/   # Integração com Supabase
│   ├── lib/            # Utilitários e funções auxiliares
│   └── pages/          # Páginas da aplicação
│       └── admin/      # Páginas da área administrativa
├── supabase/           # Configurações e migrações do Supabase
├── tailwind.config.ts  # Configuração do Tailwind CSS
└── vite.config.ts      # Configuração do Vite
```

## Páginas Principais

### Páginas Públicas
- **Home**: Página inicial com destaque para produtos, categorias, lançamentos e promoções
- **Product Detail**: Página de detalhes do produto com informações, fotos e opções de compra
- **Cart**: Carrinho de compras com lista de produtos selecionados e checkout
- **Category**: Filtro de produtos por categoria (Times Brasileiros, Times Europeus, Seleções)

### Área Administrativa
- **Dashboard**: Painel administrativo com visão geral e métricas
- **Product Management**: Gerenciamento de produtos (CRUD)

## Funcionalidades

### Para Clientes
- Navegação por categorias de produtos
- Visualização detalhada de produtos
- Adição de produtos ao carrinho
- Gestão do carrinho de compras
- Processo de checkout
- Cadastro e login de usuários
- Inscrição em newsletter

### Para Administradores
- Gerenciamento de produtos
- Visualização de métricas e vendas
- Gerenciamento de estoque
- Controle de usuários

## Integração com Supabase

O projeto utiliza o Supabase como backend, provendo:
- Banco de dados PostgreSQL para armazenamento de produtos, usuários, pedidos, etc.
- Sistema de autenticação e autorização
- Storage para armazenamento de imagens de produtos
- API REST para comunicação entre frontend e backend

## Estilos e Design

- Sistema de design consistente usando componentes shadcn/ui
- Tema personalizado com cores relacionadas ao esporte (sport-dark, sport-blue)
- Layout responsivo para desktop e dispositivos móveis
- Animações sutis para melhorar a experiência do usuário

## Como Executar o Projeto

```sh
# Clone o repositório
git clone <URL_DO_REPOSITÓRIO>

# Navegue até a pasta do projeto
cd jersey-league-shop

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## Estrutura de Dados

### Produtos
- **id**: Identificador único
- **name**: Nome do produto
- **price**: Preço atual
- **oldPrice**: Preço antigo (para produtos em promoção)
- **images**: Array de URLs das imagens
- **category**: Categoria do produto (brasileiros, europeus, selecoes)
- **isNew**: Flag para novos produtos
- **isOnSale**: Flag para produtos em promoção

### Categorias
- **name**: Nome da categoria
- **image**: URL da imagem representativa
- **path**: Caminho da rota

## Próximos Passos Planejados

- Implementação completa da integração com Supabase para produtos reais
- Sistema de busca e filtros avançados
- Sistema de avaliações de produtos
- Implementação de sistema de pagamento
- Área de perfil do usuário
- Sistema de favoritos
- Otimização de SEO
- Implementação de testes automatizados

---

*Documentação gerada em 14 de outubro de 2023 para o projeto Jersey League Shop.* 