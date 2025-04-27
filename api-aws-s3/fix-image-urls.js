require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Criar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configuração do AWS S3
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'torcidastore';
const region = process.env.AWS_REGION || 'sa-east-1';
const s3BaseUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;

async function fixImageUrls() {
  try {
    console.log('Iniciando verificação de URLs de imagens...');
    console.log(`Base URL do S3: ${s3BaseUrl}`);
    
    // Buscar todos os produtos
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, image_url')
      .is('image_url', 'not.null');
    
    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return;
    }
    
    console.log(`Encontrados ${products.length} produtos com URLs de imagem`);
    
    let fixCount = 0;
    
    for (const product of products) {
      console.log(`\nVerificando produto: ${product.id} - ${product.name}`);
      console.log(`URL atual: ${product.image_url || 'Sem URL'}`);
      
      if (!product.image_url) {
        console.log('Produto sem URL de imagem, pulando.');
        continue;
      }
      
      // Verificar se a URL está acessível
      try {
        const response = await fetch(product.image_url, { method: 'HEAD' });
        
        if (response.ok) {
          console.log('URL está acessível, não precisa de correção.');
          continue;
        }
        
        console.log(`URL não está acessível, status: ${response.status}`);
      } catch (error) {
        console.log(`Erro ao acessar URL: ${error.message}`);
      }
      
      // Tentar corrigir a URL
      let fixedUrl = product.image_url;
      
      // Caso 1: URL tem o formato errado (falta https:// ou hostname incorreto)
      if (product.image_url.includes('/uploads/') || product.image_url.includes('/products/')) {
        const pathMatch = product.image_url.match(/\/(uploads|products)\/(.+)/);
        
        if (pathMatch) {
          const path = pathMatch[0].startsWith('/') ? pathMatch[0].substring(1) : pathMatch[0];
          fixedUrl = `${s3BaseUrl}/${path}`;
        }
      }
      
      // Caso 2: URL já tem o caminho correto mas o domínio está incorreto
      else if (product.image_url.includes('s3') && !product.image_url.includes(bucketName)) {
        const urlParts = new URL(product.image_url);
        const path = urlParts.pathname.startsWith('/') ? urlParts.pathname.substring(1) : urlParts.pathname;
        fixedUrl = `${s3BaseUrl}/${path}`;
      }
      
      // Se a URL for alterada, atualizar no banco
      if (fixedUrl !== product.image_url) {
        console.log(`URL corrigida: ${fixedUrl}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: fixedUrl })
          .eq('id', product.id);
        
        if (updateError) {
          console.error('Erro ao atualizar URL:', updateError);
        } else {
          console.log('URL atualizada com sucesso!');
          fixCount++;
        }
      } else {
        console.log('Não foi possível determinar uma URL corrigida.');
      }
    }
    
    console.log(`\nProcessamento concluído. ${fixCount} URLs foram corrigidas.`);
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

fixImageUrls(); 