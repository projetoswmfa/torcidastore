/**
 * Script para solucionar problemas de visualização de imagens do S3
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Verificar dotenv no subdiretório
const dotenvPath = path.join(process.cwd(), 'api-aws-s3', '.env');
if (fs.existsSync(dotenvPath)) {
  console.log(chalk.yellow(`Usando arquivo .env de: ${dotenvPath}`));
  require('dotenv').config({ path: dotenvPath });
} else {
  require('dotenv').config();
}

const API_URL = 'http://localhost:3001/api/s3';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'torcidastore';
const REGION = process.env.AWS_REGION || 'sa-east-1';

async function main() {
  console.log(chalk.blue('=== Ferramenta de Diagnóstico de Imagens S3 ==='));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'O que você deseja fazer?',
      choices: [
        { name: '1. Verificar configuração CORS', value: 'check-cors' },
        { name: '2. Configurar CORS do bucket S3', value: 'fix-cors' },
        { name: '3. Testar acesso a uma imagem específica', value: 'test-image' },
        { name: '4. Verificar URLs de imagem no banco de dados', value: 'check-db' },
        { name: '5. Corrigir URLs no banco de dados', value: 'fix-db' },
        { name: '6. Sair', value: 'exit' }
      ]
    }
  ]);
  
  if (action === 'exit') {
    console.log(chalk.blue('Até mais!'));
    return;
  }
  
  try {
    switch(action) {
      case 'check-cors':
        await checkCors();
        break;
      case 'fix-cors':
        await fixCors();
        break;
      case 'test-image':
        await testImage();
        break;
      case 'check-db':
        await checkDatabase();
        break;
      case 'fix-db':
        await fixDatabase();
        break;
    }
  } catch (error) {
    console.error(chalk.red('Erro:'), error.message);
  }
  
  const { again } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'again',
      message: 'Deseja realizar outra ação?',
      default: true
    }
  ]);
  
  if (again) {
    await main();
  } else {
    console.log(chalk.blue('Até mais!'));
  }
}

async function checkCors() {
  const spinner = ora('Verificando configuração CORS...').start();
  
  try {
    // Testar configuração CORS existente
    const response = await fetch(`${API_URL}/cors-status`);
    const data = await response.json();
    
    spinner.succeed('Verificação concluída!');
    
    if (data.corsEnabled) {
      console.log(chalk.green('✓ CORS está configurado corretamente'));
      console.log(chalk.gray('Regras CORS:'));
      console.log(data.corsRules);
    } else {
      console.log(chalk.red('✗ CORS não está configurado'));
      console.log(chalk.yellow('Recomendação: Use a opção 2 para configurar o CORS'));
    }
  } catch (error) {
    spinner.fail('Erro ao verificar CORS');
    console.error(chalk.red('Detalhes:'), error.message);
    
    console.log(chalk.yellow('\nVerificando status do servidor API...'));
    try {
      await fetch(`${API_URL}/health`);
      console.log(chalk.green('API está rodando.'));
    } catch (err) {
      console.log(chalk.red('API parece estar offline. Inicie o servidor da API primeiro.'));
    }
  }
}

async function fixCors() {
  const spinner = ora('Configurando CORS para o bucket S3...').start();
  
  try {
    const response = await fetch(`${API_URL}/fix-cors`, { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      spinner.succeed('CORS configurado com sucesso!');
      console.log(chalk.green('O bucket S3 agora permite acesso de origens cruzadas'));
    } else {
      spinner.fail('Falha ao configurar CORS');
      console.log(chalk.red('Erro:'), result.message);
    }
  } catch (error) {
    spinner.fail('Erro ao configurar CORS');
    console.error(chalk.red('Detalhes:'), error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.yellow('O servidor da API parece estar offline. Inicie o servidor primeiro.'));
    }
  }
}

async function testImage() {
  const { imageUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'imageUrl',
      message: 'Digite a URL da imagem que deseja testar:',
      validate: (input) => input ? true : 'Por favor, digite uma URL válida'
    }
  ]);
  
  const spinner = ora('Testando acesso à imagem...').start();
  
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (response.ok) {
      spinner.succeed('Imagem acessível!');
      console.log(chalk.green(`A imagem está acessível (Status: ${response.status})`));
      
      // Verificar CORS
      const corsHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods'
      ];
      
      let corsOk = false;
      console.log(chalk.gray('\nCabeçalhos CORS:'));
      
      corsHeaders.forEach(header => {
        const value = response.headers.get(header);
        if (value) {
          console.log(`${header}: ${value}`);
          corsOk = true;
        } else {
          console.log(chalk.yellow(`${header}: Não encontrado`));
        }
      });
      
      if (!corsOk) {
        console.log(chalk.yellow('\nAtenção: Cabeçalhos CORS não encontrados.'));
        console.log(chalk.yellow('Isso pode causar problemas no navegador. Use a opção 2 para configurar o CORS.'));
      }
    } else {
      spinner.fail('Imagem não acessível');
      console.log(chalk.red(`Falha ao acessar a imagem. Status: ${response.status}`));
      
      // Sugerir URL alternativa
      if (imageUrl.includes('/')) {
        const urlParts = imageUrl.split('/');
        let key = '';
        
        if (imageUrl.includes(BUCKET_NAME)) {
          const bucketIndex = urlParts.findIndex(part => part.includes(BUCKET_NAME));
          if (bucketIndex >= 0) {
            key = urlParts.slice(bucketIndex + 1).join('/');
          }
        } else if (imageUrl.includes('uploads/') || imageUrl.includes('products/')) {
          const folderIndex = urlParts.findIndex(part => part === 'uploads' || part === 'products');
          if (folderIndex >= 0) {
            key = urlParts.slice(folderIndex).join('/');
          }
        }
        
        if (key) {
          const altUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
          console.log(chalk.yellow('\nURL alternativa sugerida:'));
          console.log(chalk.cyan(altUrl));
          
          const { testAlt } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'testAlt',
              message: 'Deseja testar esta URL alternativa?',
              default: true
            }
          ]);
          
          if (testAlt) {
            const altSpinner = ora('Testando URL alternativa...').start();
            
            try {
              const altResponse = await fetch(altUrl, { method: 'HEAD' });
              
              if (altResponse.ok) {
                altSpinner.succeed('URL alternativa acessível!');
                console.log(chalk.green('A URL alternativa está funcionando.'));
              } else {
                altSpinner.fail('URL alternativa não acessível');
                console.log(chalk.red(`Falha ao acessar URL alternativa. Status: ${altResponse.status}`));
              }
            } catch (error) {
              altSpinner.fail('Erro ao testar URL alternativa');
              console.error(chalk.red('Detalhes:'), error.message);
            }
          }
        }
      }
    }
  } catch (error) {
    spinner.fail('Erro ao testar imagem');
    console.error(chalk.red('Detalhes:'), error.message);
  }
}

async function checkDatabase() {
  console.log(chalk.yellow('Função ainda não implementada.'));
  console.log(chalk.gray('Esta função verificaria URLs de imagens no banco de dados.'));
}

async function fixDatabase() {
  console.log(chalk.yellow('Função ainda não implementada.'));
  console.log(chalk.gray('Esta função corrigiria URLs de imagens no banco de dados.'));
}

main().catch(err => {
  console.error(chalk.red('Erro fatal:'), err);
  process.exit(1);
}); 