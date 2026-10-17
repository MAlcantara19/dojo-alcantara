import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/* Estas chaves do app web NÃO são segredo (todo site que usa Firebase as mostra
   no navegador). Quem protege os dados são as regras do Firestore. */
const firebaseConfig = {
  apiKey: "AIzaSyBn0uDg1tn8jxZeW6Y0LNBX5FGgOqnqZ7w",
  authDomain: "dojo-alcantara.firebaseapp.com",
  projectId: "dojo-alcantara",
  storageBucket: "dojo-alcantara.firebasestorage.app",
  messagingSenderId: "62779164578",
  appId: "1:62779164578:web:1ba4cbe92a019aef70d4fb",
};

function app(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// Só chame estas funções dentro de efeitos ou cliques (no navegador).
export function getDb(): Firestore {
  return getFirestore(app());
}
export function getAuthInstance(): Auth {
  return getAuth(app());
}
