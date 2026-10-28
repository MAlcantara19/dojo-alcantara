/* Recebe as notificações do Dojô Alcântara com o site fechado (Firebase Cloud Messaging). */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBn0uDg1tn8jxZeW6Y0LNBX5FGgOqnqZ7w",
  authDomain: "dojo-alcantara.firebaseapp.com",
  projectId: "dojo-alcantara",
  storageBucket: "dojo-alcantara.firebasestorage.app",
  messagingSenderId: "62779164578",
  appId: "1:62779164578:web:1ba4cbe92a019aef70d4fb",
});

// Com o site fechado, o Firebase mostra a notificação sozinho (título, texto e o link ao tocar).
firebase.messaging();
