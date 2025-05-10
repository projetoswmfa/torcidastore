-- Migration para remover referências ao AWS S3 e usar apenas URLs de imagem diretamente
-- Esse script mantém apenas o campo image_url das imagens e remove campos relacionados ao armazenamento S3

-- Adicionar comentário explicativo na tabela de produtos
comment on column public.products.image_url is 'URL completa da imagem do produto';

-- Se houver produtos com caminhos S3, converter para URLs completas
update public.products
set image_url = image_url
where image_url is not null;

-- Para a tabela site_images, manter apenas o campo image_url como obrigatório
alter table public.site_images 
  alter column image_path drop not null,
  alter column image_path set default '';

comment on column public.site_images.image_path is 'Campo mantido para compatibilidade (não utilizado)';
comment on column public.site_images.image_url is 'URL completa da imagem';

-- Criar nova função para validar URLs de imagem
create or replace function public.is_valid_image_url(url text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Verificar se a URL possui extensão de imagem
  return url ~ '\.(jpeg|jpg|gif|png|webp|svg)$';
end;
$$;

comment on function public.is_valid_image_url is 'Função para validar se uma URL parece ser uma imagem válida';

-- Criar trigger para validar URLs de imagem em produtos
create or replace function public.validate_product_image_url()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Se a imagem estiver sendo definida, validar o formato
  if new.image_url is not null and not public.is_valid_image_url(new.image_url) then
    raise exception 'URL de imagem inválida. A URL deve terminar com uma extensão de imagem válida (.jpg, .png, etc)';
  end if;
  
  return new;
end;
$$;

-- Aplicar o trigger para validação de URLs
drop trigger if exists validate_product_image_url_trigger on public.products;

create trigger validate_product_image_url_trigger
before insert or update of image_url on public.products
for each row
when (new.image_url is not null)
execute function public.validate_product_image_url();

-- Criar trigger para validação de URLs em site_images
drop trigger if exists validate_site_image_url_trigger on public.site_images;

create trigger validate_site_image_url_trigger
before insert or update of image_url on public.site_images
for each row
when (new.image_url is not null)
execute function public.validate_product_image_url();

-- Criar tabela de log para registro de ações relacionadas a imagens
create table if not exists public.system_logs (
  id bigint generated always as identity primary key,
  resource_type text not null,
  resource_id text not null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

comment on table public.system_logs is 'Registros de ações do sistema, incluindo operações em imagens';

-- Habilitar RLS na tabela de logs
alter table public.system_logs enable row level security;

-- Criar política para somente leitura para usuários autenticados
create policy "Logs podem ser lidos por usuários autenticados"
on public.system_logs
for select
to authenticated
using (true);

-- Política para permitir inserção apenas de usuários autenticados
create policy "Logs podem ser inseridos por usuários autenticados"
on public.system_logs
for insert
to authenticated
with check (true);

-- Política para impedir exclusão
create policy "Logs não podem ser excluídos"
on public.system_logs
for delete
to authenticated
using (false); 