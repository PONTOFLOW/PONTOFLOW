/**
 * Configuração pública do app Web.
 *
 * Copie estes valores em:
 * Firebase Console > Configurações do projeto > Seus apps > App da Web.
 *
 * Estes identificadores não são uma senha. A proteção dos dados é feita pelo
 * Firebase Authentication e por database.rules.json.
 */
const currentHostname =
  typeof window !== "undefined" && window.location?.hostname
    ? window.location.hostname
    : "";
const isLocal =
  !currentHostname ||
  currentHostname.includes("localhost") ||
  currentHostname.includes("127.0.0.1") ||
  currentHostname.includes("github.io");

export const firebaseConfig = {
  apiKey: "AIzaSyCcRVuG8v6t3lWAAR1-ligX0Vlb9tq8Lmk",
  authDomain: isLocal
    ? "jornada-conveniencia-5jc-a4829.firebaseapp.com"
    : (currentHostname || "jornada-conveniencia-5jc-a4829.web.app"),
  databaseURL: "https://jornada-conveniencia-5jc-a4829-default-rtdb.firebaseio.com",
  projectId: "jornada-conveniencia-5jc-a4829",
  storageBucket: "jornada-conveniencia-5jc-a4829.firebasestorage.app",
  messagingSenderId: "388348433089",
  appId: "1:388348433089:web:29bd31f218e43a5b7b7a40",
};

export const APP_ROOT = "gestao-folgas/v2";
