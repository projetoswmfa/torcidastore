require('dotenv').config();
const { S3Client, GetBucketCorsCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

// Inicializar cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkAndConfigureCors() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  console.log(`Verificando configuração CORS para o bucket: ${bucketName}`);
  
  try {
    // Primeiro, verificar a configuração atual
    const corsCommand = new GetBucketCorsCommand({
      Bucket: bucketName
    });
    
    try {
      const corsResponse = await s3Client.send(corsCommand);
      console.log('Configuração CORS atual:');
      console.log(JSON.stringify(corsResponse.CORSRules, null, 2));
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log('Nenhuma configuração CORS encontrada.');
      } else {
        console.error('Erro ao obter configuração CORS:', error);
      }
    }
    
    // Aplicar nova configuração CORS
    console.log('Aplicando configuração CORS recomendada...');
    
    const putCorsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'], // Em produção, limitar para domínios específicos
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    });
    
    await s3Client.send(putCorsCommand);
    console.log('Configuração CORS aplicada com sucesso!');
    
    // Verificar se a configuração foi aplicada
    const verifyCommand = new GetBucketCorsCommand({
      Bucket: bucketName
    });
    
    const verifyResponse = await s3Client.send(verifyCommand);
    console.log('Nova configuração CORS:');
    console.log(JSON.stringify(verifyResponse.CORSRules, null, 2));
    
  } catch (error) {
    console.error('Erro ao configurar CORS:', error);
  }
}

checkAndConfigureCors(); 