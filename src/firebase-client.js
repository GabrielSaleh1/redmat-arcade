import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Os módulos externos só são carregados quando é preciso entrar numa sala.
// Assim, jogar sozinho não depende da autenticação do Firebase.
let clientPromise;
const SDK = '12.6.0';

export async function firebaseClient() {
  if (!isFirebaseConfigured) {
    throw new Error('Configure o Firebase em src/firebase-config.js antes de usar o multiplayer.');
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const [appLib, authLib, dbLib] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-database.js`)
      ]);
      const app = appLib.getApps().length ? appLib.getApp() : appLib.initializeApp(firebaseConfig);
      return { app, auth: authLib.getAuth(app), db: dbLib.getDatabase(app), authLib, dbLib };
    })().catch(err => { clientPromise = null; throw err; });
  }
  return clientPromise;
}
