require('dotenv').config();
const fetch = require('node-fetch');

// Configuração do AWS S3
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'torcidastore';
const region = process.env.AWS_REGION || 'sa-east-1';
const s3BaseUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;

// URL de exemplo recebida do upload recente
const testKey = 'uploads/1745273581699-1745273581621.jpg'; // Visto nos logs
const testUrl = `${s3BaseUrl}/${testKey}`;

async function testImageAccess() {
  console.log('Testando acesso à imagem no S3...');
  console.log(`URL da imagem: ${testUrl}`);
  
  try {
    const response = await fetch(testUrl, { method: 'HEAD' });
    
    console.log(`Status da resposta: ${response.status}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    if (response.ok) {
      console.log('✅ Imagem está acessível pelo URL!');
    } else {
      console.log('❌ Imagem não está acessível. Código de status:', response.status);
    }
    
    // Testar CORS
    console.log('\nVerificando cabeçalhos CORS...');
    
    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers'
    ];
    
    let corsConfigured = false;
    
    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      console.log(`${header}: ${value || 'Não encontrado'}`);
      if (value) corsConfigured = true;
    });
    
    if (corsConfigured) {
      console.log('✅ CORS parece estar configurado!');
    } else {
      console.log('⚠️ CORS pode não estar configurado corretamente no bucket.');
    }
    
  } catch (error) {
    console.error('Erro ao testar acesso à imagem:', error.message);
  }
}

testImageAccess(); 