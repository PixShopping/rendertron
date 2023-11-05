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
    console.log('digitando usuario');

    await page.waitForSelector('#senha');
    await page.type('#senha', senha);
    console.log('digitando senha');
    
    // Clique no botão de login (substitua o seletor apropriado)
    await page.waitForSelector('#botaoEntrar');
    await page.click('#botaoEntrar');
    console.log('entrando em outra pagina');
    
    // Espere segundos antes de continuar a execução
    await new Promise((resolve) => setTimeout(resolve, 3500));
    
    // PEGANDO BOLETIM 2023 
    await page.goto('https://sed.educacao.sp.gov.br/Aluno/ConsultaAluno'); // URL do site
    
    // Espere segundos antes de continuar a execução
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    console.log('coletando dados');
    const dadosDasDivs = await page.evaluate(() => {
      const divs = document.querySelectorAll('.form-group');
      const dados = [];
  
      divs.forEach((div) => {
        const input = div.querySelector('input');
        const label = div.querySelector('label');
        if (input && label) {
          dados.push({
            valorInput: input.value,
            textoLabel: label.textContent
          });
        }
      });
  
      return dados;
    });

    // Agora, a variável "valoresDosInputs" contém os valores de todos os inputs encontrados nas divs com a classe "form-group"
    console.log(dadosDasDivs);

    await browser.close();
    
    const responseJSON = { dadosDasDivs };
    return responseJSON;
}

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