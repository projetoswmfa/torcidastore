require('dotenv').config({ path: './api-aws-s3/.env' });
const { createClient } = require('@supabase/supabase-js');

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
      .ilike('name', '%Botafogo 24/25%');
    
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