/**
 * Configuração do aplicativo Web do Firebase: redmat-arcade.
 * Dados públicos de identificação fornecidos no console do Firebase.
 * A senha do professor NÃO deve ser colocada aqui.
 * O campo databaseURL foi preenchido após a criação do Realtime Database.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyC2FUdRkOLexWoooQnfG3ftUp92B66iJiE',
  authDomain: 'redmat-arcade.firebaseapp.com',
  databaseURL: 'https://redmat-arcade-default-rtdb.firebaseio.com',
  projectId: 'redmat-arcade',
  storageBucket: 'redmat-arcade.firebasestorage.app',
  messagingSenderId: '130180219690',
  appId: '1:130180219690:web:5a69a7dcfb0a0e2da19453',
  measurementId: 'G-1YPNWY05HK'
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain &&
  firebaseConfig.databaseURL && firebaseConfig.projectId && firebaseConfig.appId
);
