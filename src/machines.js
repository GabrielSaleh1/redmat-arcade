// REDMAT Arcade 0.5 — lista centralizada de máquinas e destinos.
// embedded: tenta abrir o site dentro do fliperama (iframe), mantendo também o botão para nova aba.
// external: mostra instruções no arcade e oferece botão para abrir a página externa.
// pending: exibe mensagem animada "em breve".
export const MACHINES = [
  {id:'trigolab',title:'Trigo Lab',short:'TRIGO LAB',cover:'trigolab',color:0x16b8e9,neon:0x33ecfa,x:-14,z:-7.7,mode:'embedded',url:'https://trigolab-527b9.web.app/#/trigonometria'},
  {id:'xadrez',title:'Xadrez',short:'XADREZ',cover:'xadrez',color:0xc78b32,neon:0xffd14e,x:-7,z:-7.7,mode:'embedded',url:'https://redmatuff.github.io/Xadrez/'},
  {id:'corrida',title:'Corrida do Perímetro',short:'CORRIDA DO PERÍMETRO',cover:'corrida-do-perimetro',color:0xe4444b,neon:0xffae3b,x:0,z:-7.7,mode:'pending',url:null,comingSoonText:'Estamos finalizando a integração desta máquina. Em breve ela estará pronta para correr no arcade!'},
  {id:'financeiro',title:'Mestre do Desafio Financeiro',short:'DESAFIO FINANCEIRO',cover:'mestre-financeiro',color:0xefab26,neon:0xffd342,x:7,z:-7.7,mode:'embedded',url:'https://redmatuff.github.io/MDF/'},
  {id:'triangulo',title:'Triângulo Mágico',short:'TRIÂNGULO MÁGICO',cover:'triangulo-magico',color:0x9b44dc,neon:0xfc75fc,x:14,z:-7.7,mode:'embedded',url:'https://redmatuff.github.io/Triangulo-Magico/'},
  {id:'adivinhe',title:'Adivinhe o Número',short:'ADIVINHE O NÚMERO',cover:'adivinhe-o-numero',color:0x1b976c,neon:0x37f8b5,x:-14,z:6.5,mode:'embedded',url:'https://redmatuff.github.io/Adivinhe-o-Numero/'},
  {id:'multa',title:'Simulador de Multa',short:'SIMULADOR DE MULTA',cover:'simulador-de-multa',color:0xc83044,neon:0xff6666,x:-7,z:6.5,mode:'embedded',url:'https://redmatuff.github.io/Multa/'},
  {id:'batalha',title:'Batalha Naval Cartesiana',short:'BATALHA NAVAL',cover:'batalha-naval',color:0x2163b2,neon:0x5aabff,x:0,z:6.5,mode:'embedded',url:'https://redmatuff.github.io/Batalha-Naval/'},
  {id:'lancamento',title:'Lançamento Parabólico',short:'LANÇAMENTO PARABÓLICO',cover:'lancamento-parabolico',color:0x269ecc,neon:0x73f1fa,x:7,z:6.5,mode:'embedded',url:'https://redmatuff.github.io/Lan-amento/'},
  {id:'detetive',title:'Detetive Matemático',short:'DETETIVE MATEMÁTICO',cover:'detetive-matematico',color:0xc08435,neon:0xffc259,x:14,z:6.5,mode:'external',url:'https://chinxia.itch.io/redmatuff',requiresPassword:true,password:'redmat2025'}
];
