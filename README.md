# REDMAT Arcade v0.5

Lobby 3D do REDMAT UFF, agora com a identidade visual do projeto.

## Novidades desta versão

- **Janela do jogo = gabinete de fliperama**: letreiro iluminado com o nome do jogo, tela com moldura, painel de controle inclinado com joysticks e botões, porta de fichas e laterais neon. A tela do jogo ficou bem maior (ocupa cerca de 2/3 da altura da janela).
- Botões no painel: **Voltar ao lobby**, **Tela cheia** e **Abrir em outra aba**. Animação de "tela ligando" e indicador de carregamento.
- Card **"Em breve"** da Corrida do Perímetro não é mais cortado.
- **Cenário refeito** com a paleta REDMAT (azul-marinho, vermelho-coral, ciano, creme): letreiro com o logo, piso com o logo no centro, gabinetes com silhueta de fliperama, banquinhos, placa de giz e banner, símbolos matemáticos flutuando.
- **Matinho Doutor remodelado** conforme a prancheta: cabeça de cantos arredondados, tela verde com óculos pretos, faixa vermelha, jaleco, gravata, luvas e sapatos vermelhos. Ele pisca e fica animado (> <) quando chega perto de uma máquina.
- Intro e HUD com o logo REDMAT, tipografia Playfair Display + Montserrat.

## Estrutura

```
index.html
style.css
src/main.js
src/machines.js
assets/logo-redmat.png
assets/conceito.webp
assets/capas/*.webp
.nojekyll
```

## Como executar

1. Abra a pasta no VS Code.
2. Instale a extensão Live Server.
3. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.

(Precisa de internet: Three.js e as fontes vêm de CDN.)

## Controles

- WASD ou setas: movimentar
- Shift: correr
- E: interagir com a máquina
- Esc: fechar modal ou ajuda

## Pendente

- Corrida do Perímetro (aparece como "Em breve")
