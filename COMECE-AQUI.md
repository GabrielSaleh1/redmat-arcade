# REDMAT Arcade Multiplayer — v1.0 (protótipo de oficina)

Esta é a primeira versão multiplayer baseada no REDMAT Arcade v0.8. O visual do salão e os jogos originais permanecem; alunos que entram na **mesma sala** podem se ver e se movimentar, cada um com seu **apelido sobre a cabeça**. Os jogos acessados nas máquinas **continuam individuais** nesta fase.

## O que já está implementado

- Tela de entrada com nick de 2 a 18 caracteres + código de sala de 8 caracteres;
- Modo individual (sem Firebase) disponível;
- Todos os alunos da mesma sala compartilham posição e direção em tempo real (4 atualizações/s por jogador, com interpolação visual);
- Cada jogador remoto recebe um avatar leve inspirado no Matinho Doutor e uma etiqueta de nick;
- Nick também aparece sobre o Matinho local;
- Painel do professor em `professor.html` com **e-mail e senha do Firebase Authentication**, sem link no lobby;
- Controle de acesso **no servidor** via `firebase/database.rules.json` + lista de UIDs autorizados (`teachers`);
- Professor cria/encerra salas, copia o código ou convite e acompanha a lista de nicks conectados;
- Presença removida com `onDisconnect()` se o aluno fecha a aba ou perde a conexão (após detecção de desconexão pelo servidor);
- Cena original, NPCs, interação, 10 máquinas, HUD, iframe e modo leve preservados.

## Passo a passo: configurar o Firebase (necessário para o multiplayer real)

**1.** Abra https://console.firebase.google.com/ e crie um projeto (ex.: `redmat-arcade`).

**2.** Adicione um app da plataforma Web `</>` nas configurações do projeto. Copie as chaves do objeto `firebaseConfig` no arquivo **`src/firebase-config.js`**: `apiKey`, `authDomain`, `projectId`, `appId` e, principalmente, o `databaseURL` da base Realtime Database. Estas chaves são identificadores públicos do aplicativo, não a senha do professor.

**3.** Menu **Build → Authentication → Sign-in method**: habilite **Anonymous** para os alunos e **Email/Password** para o professor.

**4.** Ainda em Authentication → **Users**, adicione manualmente uma conta de professor, com e-mail e senha forte. **Copie o UID dessa conta.** Não escreva essa senha nos arquivos do site.

**5.** Em **Build → Realtime Database**, crie o banco. Selecione **modo bloqueado**, nunca modo teste. Anote o endereço do banco para o `databaseURL` (o domínio depende da região, podendo terminar em `firebasedatabase.app`).

**6.** Na guia **Data** do Realtime Database, crie a seguinte estrutura, substituindo `UID_REAL_DO_PROFESSOR` pelo UID da etapa 4 (o valor precisa ser booleano, não a string "true"):

```json
{
  "teachers": {
    "UID_REAL_DO_PROFESSOR": true
  }
}
```

Se já existirem outros dados no banco, **adicione apenas a chave `teachers/UID_REAL_DO_PROFESSOR`**, sem sobrescrever o banco inteiro.

**7.** Na guia **Rules** do Realtime Database, substitua as regras existentes pelo conteúdo de **`firebase/database.rules.json`** e clique em **Publish**. Essas regras são o que realmente impedem alunos de criar ou encerrar salas. O painel não é protegido só por um link escondido.

**8.** Abra a pasta no VS Code e execute `professor.html` com Live Server. Entre com o usuário autorizado, crie uma sala e copie o código. Em outra janela (ou computador), abra `index.html`, escolha um apelido e digite o código. Para testar duas pessoas, use dois navegadores diferentes, ou uma janela anônima para o aluno.

**9.** Após testar, publique **todos os arquivos da pasta raiz** no GitHub Pages. `index.html` é a página dos alunos; `professor.html` é o painel restrito. **Não disponibilize o e-mail e senha do professor aos alunos.** O endereço do painel por si só não concede permissão.

## Teste rápido antes de criar o Firebase

O modo individual deve abrir normalmente: `index.html` → **Entrar no fliperama** → escreva um apelido → **Explorar sozinho**. O nick fica acima do Matinho. Clicar em **Entrar na sala** sem configurar Firebase exibirá uma mensagem de configuração pendente.

## Como funciona numa oficina

1. O professor entra em `professor.html`, acessa com sua conta e cria uma sala.
2. Projeta o código de 8 caracteres ou distribui o link de convite, que já preenche o código.
3. Cada aluno escolhe um apelido (evite nomes completos) e entra.
4. Os Matinhos aparecem no lobby com os apelidos em cima da cabeça.
5. As posições são sincronizadas enquanto o aluno explora. Cada jogo original continua isolado dentro da máquina; **jogar Xadrez entre dois alunos ainda não está implementado**.
6. Ao encerrar, o professor clica **Encerrar sala**. O banco remove a lista de presença.

## Proteção e limites deste primeiro protótipo

- A autorização do professor é verificada pelo Firebase Auth **e** pelas Realtime Database Rules. Nada de senha hardcoded em JS ou `localStorage`.
- O código da sala controla a entrada; quem souber o código pode entrar como aluno, não como professor.
- Alunos são autenticados anonimamente, sem cadastro e sem pedir endereço de e-mail, e só podem alterar seus próprios registros.
- O limite de até 30 aparece no criador de salas e é conferido na entrada. **Ainda não é um limite transacional garantido no servidor**: entradas simultâneas ou clientes maliciosos podem excedê-lo. Para eventos maiores, será necessário um controle de vagas no backend.
- Os apelidos são visíveis para quem estiver na sala; peça pseudônimos e não identifique menores por nome completo. Não há chat livre nem registro de desempenho nesta versão.
- O Firebase impõe limites aos novos cadastros anônimos por IP. **Uma escola inteira atrás do mesmo IP pode ser afetada**. Teste com 5, depois 15, depois 30 computadores na rede real, antes da oficina. Consulte as cotas e preços atuais do Firebase.
- Não submeta ou publique chaves privadas, arquivos de conta de serviço nem credenciais do professor no repositório.
- A tela principal depende da conexão à CDN do Three.js; o multiplayer também depende de Firebase.
- Testes realizados aqui: verificação de sintaxe dos módulos JS, estrutura e importações locais, JSON das regras e presença de 10 capas. **O teste de múltiplos jogadores reais ainda exige um projeto Firebase configurado e dispositivos conectados**, o que não foi possível concluir neste ambiente.

## Arquivos novos

- `professor.html` / `professor.css`: painel independente.
- `src/teacher.js`: login e criação/controle de salas.
- `src/firebase-config.js`: preenchimento dos dados públicos do app.
- `src/firebase-client.js`: carregamento sob demanda do SDK.
- `src/multiplayer.js`: autenticação anônima, presença, movimento.
- `src/network-avatars.js`: avatares leves remotos e apelidos em 3D.
- `firebase/database.rules.json`: regras do banco.
