"use client";

import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { getAuthInstance, getDb } from "./firebase";

/*
 * Notificações no celular (Firebase Cloud Messaging).
 * Precisa da “chave pública de notificações” (VAPID), colada em Painel > Site > Aparência.
 * No iPhone só funciona com o site instalado na tela de início (iOS 16.4 ou mais novo).
 */
export function notificacoesSuportadas(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window && "PushManager" in window;
}

export async function ativarNotificacoes(vapidKey: string, dados: { uid: string; turma: string; papel: string }): Promise<string> {
  if (!notificacoesSuportadas()) throw new Error("sem-suporte");
  if (!vapidKey) throw new Error("sem-chave");
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") throw new Error("negado");
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) throw new Error("sem-suporte");
  const registro = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(getMessaging(), { vapidKey, serviceWorkerRegistration: registro });
  await setDoc(doc(getDb(), "pushTokens", token), { ...dados, ts: Date.now() });
  try {
    localStorage.setItem("dojoPushToken", token);
  } catch {}
  return token;
}

export async function desativarNotificacoes() {
  let token = "";
  try {
    token = localStorage.getItem("dojoPushToken") ?? "";
    localStorage.removeItem("dojoPushToken");
  } catch {}
  if (token) await deleteDoc(doc(getDb(), "pushTokens", token)).catch(() => undefined);
}

export function notificacoesLigadas(): boolean {
  try {
    return Boolean(localStorage.getItem("dojoPushToken")) && Notification.permission === "granted";
  } catch {
    return false;
  }
}

/** Pede ao servidor do site para mandar a notificação (só a equipe consegue). Nunca trava quem chamou. */
export async function notificar(n: { titulo: string; texto: string; link?: string; turmas?: string[]; uids?: string[] }): Promise<void> {
  try {
    const u = getAuthInstance().currentUser;
    if (!u) return;
    const token = await u.getIdToken();
    await fetch("/api/notificar", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(n) });
  } catch {
    /* notificação é um extra: se falhar, o resto continua */
  }
}

export function mensagemPush(e: unknown): string {
  const m = e instanceof Error ? e.message : "";
  if (m === "sem-suporte") return "Este navegador não recebe notificações. No iPhone, instale o site na tela de início primeiro.";
  if (m === "sem-chave") return "As notificações ainda não foram configuradas pelo administrador.";
  if (m === "negado") return "Você não permitiu as notificações. Para ligar depois, libere nas configurações do navegador.";
  return "Não consegui ligar as notificações agora. Tente de novo.";
}
