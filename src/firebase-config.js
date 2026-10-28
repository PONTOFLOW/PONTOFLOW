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
  apiKey: "AIzaSyAxtI1DJdERljmITBWSPpcY1jGhZWIudyc",
  authDomain: isLocal
    ? "pontoflow-9635c.firebaseapp.com"
    : (currentHostname || "pontoflow-9635c.web.app"),
  databaseURL: "https://pontoflow-9635c-default-rtdb.firebaseio.com",
  projectId: "pontoflow-9635c",
  storageBucket: "pontoflow-9635c.firebasestorage.app",
  messagingSenderId: "545952579826",
  appId: "1:545952579826:web:edec0bf0f5082b7655106b",
  measurementId: "G-8DD00GL16N",
};

export const APP_ROOT = "gestao-folgas/v2";
