import { createClient } from '@supabase/supabase-js';

// Usar as mesmas credenciais do frontend
const SUPABASE_URL = "https://ddydxrtqzmseqqsgvwml.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeWR4cnRxem1zZXFxc2d2d21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NDUsImV4cCI6MjA2MDY2ODc0NX0.9YmfMwUElQmkbn8gNlKiYkkJrhww9EmLj-DVDpjq14Y";

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProductImage() {
  try {
    // Buscar produto específico
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url')
      .ilike('name', '%Botafogo%Torcedor%Reebok%');
    
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
      
      // Se encontrou o produto específico, vamos atualizar a URL da imagem
      if (data.length === 1) {
        const productId = data[0].id;
        console.log(`\nVerificando se o upload para AWS S3 atualizou o campo image_url para o produto ID: ${productId}\n`);
        
        // Verificar se há logs de uploads recentes
        const { data: logs, error: logsError } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('action', 'upload_image')
          .eq('resource_id', productId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (logsError) {
          console.error('Erro ao buscar logs:', logsError);
        } else if (logs && logs.length > 0) {
          console.log('Logs de upload recentes:');
          logs.forEach(log => {
            console.log(`- ${log.created_at}: ${log.details}`);
          });
        } else {
          console.log('Nenhum log de upload encontrado para este produto.');
        }
      }
    } else {
      console.log('Nenhum produto encontrado com esse nome.');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkProductImage(); 