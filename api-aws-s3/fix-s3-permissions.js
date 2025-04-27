require('dotenv').config();
const { 
  S3Client, 
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand
} = require('@aws-sdk/client-s3');

// Inicializar cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

// Função principal
async function fixS3Permissions() {
  console.log(`Iniciando correção de permissões para o bucket: ${bucketName}`);
  
  // Passo 1: Remover bloqueio de acesso público
  await removePublicAccessBlock();
  
  // Passo 2: Definir política do bucket para permitir acesso público de leitura
  await setPublicReadPolicy();
  
  // Passo 3: Configurar CORS
  await configureCors();
  
  console.log('Correção de permissões concluída!');
}

// Remover bloqueio de acesso público do bucket
async function removePublicAccessBlock() {
  console.log('Removendo bloqueio de acesso público...');
  
  try {
    const command = new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    });
    
    await s3Client.send(command);
    console.log('✅ Bloqueio de acesso público removido com sucesso');
  } catch (error) {
    console.error('❌ Erro ao remover bloqueio de acesso público:', error);
    throw error;
  }
}

// Definir política do bucket para permitir acesso público de leitura
async function setPublicReadPolicy() {
  console.log('Configurando política de acesso público...');
  
  // Política para permitir acesso público de leitura a todos os objetos do bucket
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadForGetBucketObjects',
        Effect: 'Allow',
        Principal: '*',
        Action: [
          's3:GetObject'
        ],
        Resource: [
          `arn:aws:s3:::${bucketName}/*`
        ]
      }
    ]
  };
  
  try {
    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    });
    
    await s3Client.send(command);
    console.log('✅ Política de acesso público configurada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar política de acesso público:', error);
    throw error;
  }
}

// Configurar CORS
async function configureCors() {
  console.log('Configurando CORS...');
  
  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
            MaxAgeSeconds: 86400
          }
        ]
      }
    });
    
    await s3Client.send(command);
    console.log('✅ Configuração CORS aplicada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar CORS:', error);
    throw error;
  }
}

// Executar script
fixS3Permissions().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
}); 