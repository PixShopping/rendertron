// BIBLIOTECAS
const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs =  require('fs');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

async function autoFillAndSubmitForm(usuario, senha) {
    const browser = await puppeteer.launch({
        headless: true, // Torna o navegador visível
    });
    const page = await browser.newPage();
  
    await page.goto('https://sed.educacao.sp.gov.br/'); // URL do site
  
    const ra = usuario.slice(0,12);
    const digito = usuario.slice(-1);
    
    await page.waitForSelector('#name');
    await page.type('#name', usuario);

    await page.waitForSelector('#senha');
    await page.type('#senha', senha);
    
    // Clique no botão de login (substitua o seletor apropriado)
    await page.waitForSelector('#botaoEntrar');
    await page.click('#botaoEntrar');
    
    // Espere segundos antes de continuar a execução
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // PEGANDO BOLETIM 2023 
    await page.goto('https://sed.educacao.sp.gov.br/Aluno/ConsultaAluno'); // URL do site
    
    // Espere segundos antes de continuar a execução
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const dadosDasDivs = await page.evaluate(() => {
      const divs = document.querySelectorAll('.form-group');
      const dados = [];
  
      divs.forEach((div) => {
        const input = div.querySelector('input');
        const label = div.querySelector('label');
        if (input && label) {
          dados.push({
            input: input.value,
            label: label.textContent
          });
        }
      });
  
      return dados;
    });

    await browser.close();
    
    const responseJSON = { dadosDasDivs };
    return responseJSON;
}

async function boletimSed(usuario, senha) {
  const browser = await puppeteer.launch({
      headless: true, // Torna o navegador visível usar FALSE
  });

  const page = await browser.newPage();
  
  await page.goto('https://sed.educacao.sp.gov.br/');

  const ra = usuario.slice(0,12);
  const digito = usuario.slice(-1);
  
  await page.waitForSelector('#name');
  await page.type('#name', `${usuario}SP`);

  await page.waitForSelector('#senha');
  await page.type('#senha', senha);

  // Clique no botão de login (substitua o seletor apropriado)
  await page.waitForSelector('#botaoEntrar');
  await page.click('#botaoEntrar');
  
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  await page.goto('https://sed.educacao.sp.gov.br/Boletim/BoletimAluno');

  await page.waitForSelector('#txtNrRa');
  await page.type('#txtNrRa', ra);

  await page.waitForSelector('#txtNrDigRa');
  await page.type('#txtNrDigRa', digito);

  await page.waitForSelector('#ddlUfRa');
  await page.select('#ddlUfRa', 'SP');

  await page.waitForSelector('button[type="submit"]');
  await page.click('button[type="submit"]');

  await new Promise((resolve) => setTimeout(resolve, 10000));
  
  await browser.close();
}


// ===== { ROTAS } =====

// API DO BOLETIM
app.get('/boletim', (req, res) => {
const usuario = req.query.usuario;
const senha = decodeURIComponent(req.query.senha);

// Verifica se o usuário e a senha foram fornecidos na URL
if (!usuario || !senha) {
  return res.status(400).json({ error: 'Usuário, Senha são obrigatórios.' });
}

// Chama a função para preencher o formulário e fazer login com os parâmetros recebidos
boletimSed(usuario, senha)
  .then((data) => {
    return res.json(data);
  })
  .catch((error) => {
  console.error('Erro ao preencher o formulário e fazer login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  });
});


// API DOS DADOS DA SED
app.get('/login', (req, res) => {
  const usuario = req.query.usuario;
  const senhaAlterada = req.query.senha;
  const senha = decodeURIComponent(senhaAlterada);

  // Verifica se o usuário e a senha foram fornecidos na URL
  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  // Chama a função para preencher o formulário e fazer login com os parâmetros recebidos
  autoFillAndSubmitForm(usuario, senha)
    .then((data) => {
      return res.json(data);
    })
    .catch((error) => {
      console.error('Erro ao preencher o formulário e fazer login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    });
});

// Inicializa o servidor
app.listen(port, () => {
  console.log('Servidor está rodando na porta ' + port);
});