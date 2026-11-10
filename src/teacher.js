import { firebaseClient } from './firebase-client.js';

const $ = id => document.getElementById(id);
let client, teacherUID = '', selectedRoom = null;
let offMyRooms = null, offStudents = null, offMeta = null;
let roomRefs = {};
const setMessage = (message, error = false) => {
  $('teacher-message').textContent = message;
  $('teacher-message').classList.toggle('error', error);
};
const generateCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(random, n => letters[n % letters.length]).join('');
};
const invitationLink = code => {
  const url = new URL('./index.html', location.href);
  url.searchParams.set('sala', code);
  return url.href;
};
async function authorized() {
  const { db, dbLib: d, auth } = client;
  if (!auth.currentUser) return false;
  const value = await d.get(d.ref(db, `teachers/${auth.currentUser.uid}`));
  return value.val() === true;
}
const off = () => {
  for (const fn of [offMyRooms, offStudents, offMeta]) try { fn?.(); } catch { /* nada */ }
  offMyRooms = offStudents = offMeta = null;
};
async function showPanel() {
  teacherUID = client.auth.currentUser.uid;
  $('logged-as').textContent = client.auth.currentUser.email || '';
  $('login-section').classList.add('hidden');
  $('control-section').classList.remove('hidden');
  const { db, dbLib: d } = client;
  offMyRooms = d.onValue(d.ref(db, `teacherRooms/${teacherUID}`), snapshot => {
    roomRefs = snapshot.val() || {};
    void paintRooms();
  }, error => setMessage(error.message, true));
}
async function paintRooms() {
  const { db, dbLib: d } = client;
  const codes = Object.keys(roomRefs || {}).reverse();
  const list = $('rooms-list'); list.replaceChildren();
  if (!codes.length) { const p = document.createElement('p'); p.className='dim'; p.textContent='Nenhuma sala criada.'; list.append(p); return; }
  for (const code of codes) {
    const btn = document.createElement('button'); btn.className = 'room-button'; btn.type = 'button';
    if (code === selectedRoom) btn.classList.add('selected');
    const left = document.createElement('span'); left.textContent = code;
    const right = document.createElement('small'); right.textContent = 'Visualizar'; btn.append(left, right);
    btn.addEventListener('click', () => void selectRoom(code)); list.append(btn);
    // Atualização independente: não deixa uma sala antiga bloquear as demais.
    d.get(d.ref(db, `rooms/${code}/meta`)).then(snap => {
      const m = snap.val();
      right.textContent = m ? (m.open ? 'ABERTA' : 'ENCERRADA') : 'NÃO ENCONTRADA';
    }).catch(() => { right.textContent='Indisponível'; });
  }
}
async function selectRoom(code) {
  try { offStudents?.(); offMeta?.(); } catch { /* nada */ }
  selectedRoom = code;
  $('selected-empty').classList.add('hidden'); $('selected-info').classList.remove('hidden');
  $('selected-code').textContent = code;
  const { db, dbLib: d } = client;
  offMeta = d.onValue(d.ref(db, `rooms/${code}/meta`), snap => {
    const m = snap.val();
    $('selected-meta').textContent = !m ? 'Sala não encontrada.' : `${m.title} · Capacidade: ${m.capacity} · ${m.open ? 'Aberta' : 'Encerrada'}`;
    $('end-room').disabled = !m?.open;
  });
  offStudents = d.onValue(d.ref(db, `rooms/${code}/players`), snap => {
    const students = Object.entries(snap.val() || {});
    $('selected-count').textContent = `${students.length} participante(s) conectado(s)`;
    $('students-total').textContent = `(${students.length})`;
    const list = $('students-list'); list.replaceChildren();
    if (!students.length) { const p = document.createElement('p'); p.className='dim'; p.textContent='Aguardando os alunos entrarem...'; list.append(p); }
    for (const [uid, p] of students) {
      const div = document.createElement('div'); div.className='student';
      const n = document.createElement('span'); n.textContent = String(p?.nick || 'Aluno').slice(0, 18);
      const tag = document.createElement('small'); tag.textContent='CONECTADO';
      div.append(n,tag); list.append(div);
    }
  }, error => setMessage(error.message, true));
  void paintRooms();
}
$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('login-error').textContent = '';
  $('login-button').disabled = true;
  try {
    client = await firebaseClient();
    const { auth, authLib: a } = client;
    await a.setPersistence(auth, a.browserSessionPersistence);
    await a.signInWithEmailAndPassword(auth, $('teacher-email').value.trim(), $('teacher-password').value);
    const permit = await authorized();
    if (!permit) { await a.signOut(auth); throw new Error('Esta conta não tem permissão de professor. Cadastre o UID na lista teachers do banco.'); }
    $('teacher-password').value='';
    await showPanel();
  } catch (error) { $('login-error').textContent = error.message || 'Falha de login.'; }
  finally { $('login-button').disabled = false; }
});
$('create-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('create-button').disabled = true;
  try {
    if (!await authorized()) throw new Error('Conta sem autorização de professor.');
    const { db, dbLib: d } = client;
    let code = '';
    for (let i = 0; i < 6; i++) {
      const candidate = generateCode();
      const snap = await d.get(d.ref(db, `rooms/${candidate}/meta`));
      if (!snap.exists()) { code = candidate; break; }
    }
    if (!code) throw new Error('Não foi possível gerar um código único. Tente novamente.');
    const title = $('workshop-name').value.trim().slice(0, 50) || 'Oficina REDMAT';
    const meta = { title, capacity: Number($('max-participants').value), open: true, ownerUid: teacherUID, createdAt: Date.now() };
    await d.update(d.ref(db), { [`rooms/${code}/meta`]: meta, [`teacherRooms/${teacherUID}/${code}`]: true });
    await selectRoom(code);
    setMessage(`Sala ${code} criada. Compartilhe o código ou o link da sala com os alunos.`);
  } catch (error) { setMessage(error.message || 'Erro ao criar sala.', true); }
  finally { $('create-button').disabled = false; }
});
$('copy-code').addEventListener('click', () => {
  if (selectedRoom) navigator.clipboard.writeText(selectedRoom).then(() => setMessage('Código copiado.')).catch(() => setMessage('Não foi possível copiar.', true));
});
$('copy-link').addEventListener('click', () => {
  if (selectedRoom) navigator.clipboard.writeText(invitationLink(selectedRoom)).then(() => setMessage('Convite copiado.')).catch(() => setMessage('Não foi possível copiar.', true));
});
$('end-room').addEventListener('click', async () => {
  if (!selectedRoom || !window.confirm(`Encerrar a sala ${selectedRoom}? Todos os alunos serão desconectados.`)) return;
  try {
    const { db, dbLib: d } = client;
    await d.update(d.ref(db, `rooms/${selectedRoom}/meta`), { open: false });
    await d.remove(d.ref(db, `rooms/${selectedRoom}/players`));
    setMessage(`Sala ${selectedRoom} encerrada.`);
  } catch (error) { setMessage(error.message || 'Erro ao encerrar.', true); }
});
$('logout-button').addEventListener('click', async () => {
  off(); selectedRoom = null; teacherUID = '';
  if (client) await client.authLib.signOut(client.auth);
  $('login-section').classList.remove('hidden'); $('control-section').classList.add('hidden');
  $('login-form').reset();
});
