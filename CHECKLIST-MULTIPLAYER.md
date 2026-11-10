# Checklist de validação do REDMAT Arcade Multiplayer

## Sem Firebase
- [ ] Live Server abre `index.html` sem tela preta.
- [ ] Ao clicar "Entrar no fliperama", aparece a escolha do apelido e código.
- [ ] O modo "Explorar sozinho" entra no lobby e mostra o nick acima do Matinho.
- [ ] Caminhada, corrida, câmera, NPCs e jogos continuam funcionando.
- [ ] Código vazio não permite entrar em sala.

## Professor (Firebase configurado)
- [ ] Um usuário não autorizado, mesmo conhecendo o endereço `professor.html`, não consegue criar salas.
- [ ] A conta autorizada consegue fazer login e criar sala de 8 caracteres.
- [ ] O botão "Copiar convite" produz um link com `?sala=CODIGO`.
- [ ] O painel mostra o número e os apelidos dos alunos conectados.
- [ ] "Encerrar sala" fecha a sala e remove presença.

## Alunos com duas máquinas diferentes
- [ ] Os dois entram com o mesmo código e nicks distintos.
- [ ] Cada um vê o nome do outro sobre um Matinho 3D.
- [ ] Movimento e rotação são sincronizados sem teleporte constante.
- [ ] Sair do lobby ou desconectar faz o avatar remoto desaparecer.
- [ ] Abertura de jogo preserva o lobby e o link original.
- [ ] Entrar com código errado retorna mensagem clara.
- [ ] Após fechar a sala, novas entradas não são aceitas.

## Oficina de verdade
- [ ] Realizar teste com 5, 15 e 30 equipamentos na rede da escola.
- [ ] Verificar limitação de cadastros anônimos por IP e consumo do Firebase.
- [ ] Manter apenas nicks, sem nomes completos ou chat aberto.


## Teste dos personagens (v1.1)

- [ ] Em dois navegadores, confirmar que ambos têm o mesmo Matinho Doutor (jaleco, óculos, rosto e sapatos).
- [ ] O nick de cada aluno aparece acima da cabeça do Matinho correto.
- [ ] Andar em um computador e observar a animação no outro.
- [ ] Sair da sala e reconectar, verificando a remoção e recriação do personagem.
- [ ] Testar vários dispositivos antes de uma oficina com turma completa.
