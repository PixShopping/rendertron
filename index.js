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
        headless: false, // Torna o navegador visível
    });
    const page = await browser.newPage();
  
    await page.goto('https://sed.educacao.sp.gov.br/'); // URL do site
  

    await page.waitForSelector('#name');
    await page.type('#name', usuario);

    await page.waitForSelector('#senha');
    await page.type('#senha', senha);
  
    // Clique no botão de login (substitua o seletor apropriado)
    await page.waitForSelector('#botaoEntrar');
    await page.click('#botaoEntrar');
  
    // Aguarda o elemento com o ID "idPerfilMs" aparecer na página
    await page.waitForSelector('#idPerfilMs');

  // Coleta o conteúdo do elemento LI com o ID "idPerfilMs"
    const idPerfilMsContent = await page.$eval('#idPerfilMs', (element) => {
        return element.textContent;
    });
    console.log(idPerfilMsContent);

    await browser.close();
  
  const responseJSON = { idPerfilMsContent };
  return responseJSON;
}

app.get('/login', (req, res) => {
    const usuario = req.query.usuario;
    const senhaCodificada = req.query.senha; // Senha codificada na URL
    const senha = decodeURIComponent(senhaCodificada); // Decodifica a senha

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