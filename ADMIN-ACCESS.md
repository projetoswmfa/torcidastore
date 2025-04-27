# Informações de Acesso - Jersey League Shop

## Usuários Administradores
Para acessar o sistema como administrador, utilize uma das seguintes credenciais:

### Usuário Principal
**Email:** torcida.store@gmail.com  
**Senha:** store@!

### Usuário Alternativo
**Email:** admin2@jersey.com  
**Senha:** admin123

Ambos os usuários possuem permissões de administrador, o que permite:
- Acesso ao painel administrativo
- Gerenciamento de produtos
- Gerenciamento de usuários
- Visualização de pedidos
- Configurações do sistema

## Nota sobre Acesso
O usuário de suporte original (suporte@suporte.com) apresenta problemas de autenticação e não deve ser utilizado.

## Resolução de Problemas

Se encontrar o erro "Database error querying schema" ao fazer login, este problema foi corrigido. O erro estava relacionado a um problema no schema do banco de dados, especificamente na coluna `email_change` que estava sendo convertida de NULL para string.

Em caso de problemas com autenticação:
1. Verifique se está usando as credenciais corretas
2. Certifique-se de que o usuário tenha o email confirmado
3. Verifique as políticas de segurança (RLS) se não conseguir acessar recursos específicos

## Notas Técnicas
- O sistema usa Supabase para autenticação e banco de dados
- As permissões são gerenciadas através da tabela `user_roles`
- As políticas RLS controlam o acesso aos dados baseado no papel do usuário 