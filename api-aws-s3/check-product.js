require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Verificar a configuração
console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Definido' : 'Não definido');
console.log('Supabase Key:', process.env.SUPABASE_SERVICE_KEY ? 'Definido (primeiros caracteres: ' + process.env.SUPABASE_SERVICE_KEY.substring(0, 10) + '...)' : 'Não definido');

// Criar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkProductImage() {
  try {
    // Buscar produto pelo nome
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url')
      .ilike('name', '%Botafogo%');
    
    if (error) {
      console.error('Erro ao buscar produto:', error);
      return;
    }
    
    console.log('Produtos encontrados:', data.length);
    
    if (data && data.length > 0) {
      data.forEach(product => {
        console.log('ID:', product.id);
        console.log('Nome:', product.name);
        console.log('URL da imagem:', product.image_url || 'Sem imagem');
        console.log('-----------------------------------');
      });
    } else {
      console.log('Nenhum produto encontrado com esse nome.');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkProductImage(); 