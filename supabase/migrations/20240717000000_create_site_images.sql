-- Criação da tabela site_images para armazenar imagens do site como banners e imagens de categorias

-- Remover a tabela anterior se existir (isso é seguro pois estamos em desenvolvimento)
drop table if exists public.site_images;

-- Criação da tabela com a estrutura correta para o frontend
create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'category', 'banner', etc
  reference_id text, -- id da categoria ou referência a outro elemento
  image_path text not null, -- caminho no storage
  image_url text, -- URL completa da imagem
  title text, -- título da imagem (exibido no banner ou na categoria)
  description text, -- descrição (pode ser usado em banners)
  link text, -- link para onde a imagem redireciona (caso seja necessário)
  active boolean default true, -- se a imagem está ativa
  order_position integer default 0, -- posição de ordenação
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentários da tabela
comment on table public.site_images is 'Tabela para armazenar imagens do site como banners e imagens de categorias';
comment on column public.site_images.id is 'Identificador único da imagem';
comment on column public.site_images.type is 'Tipo de imagem (banner, category, etc)';
comment on column public.site_images.reference_id is 'ID de referência (como ID da categoria)';
comment on column public.site_images.image_path is 'Caminho/key da imagem no S3';
comment on column public.site_images.image_url is 'URL completa da imagem';
comment on column public.site_images.title is 'Título exibido (opcional)';
comment on column public.site_images.description is 'Descrição exibida (opcional)';
comment on column public.site_images.link is 'Link para redirecionamento (opcional)';
comment on column public.site_images.active is 'Se a imagem está ativa/visível';
comment on column public.site_images.order_position is 'Posição de ordenação para exibição';

-- Habilitando RLS
alter table public.site_images enable row level security;

-- Criando políticas de acesso
create policy "Imagens visíveis para todos" on site_images
  for select
  to anon, authenticated
  using (true);

create policy "Somente administradores podem inserir imagens" on site_images
  for insert
  to authenticated
  with check (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Somente administradores podem atualizar imagens" on site_images
  for update
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Somente administradores podem excluir imagens" on site_images
  for delete
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Criando função para obter imagens por tipo
create or replace function public.get_site_images_by_type(image_type text)
returns setof public.site_images
language sql
security invoker
set search_path = ''
as $$
  select * from public.site_images 
  where type = image_type and active = true
  order by order_position asc;
$$; 