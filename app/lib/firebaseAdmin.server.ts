import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

/* Acesso de servidor ao Firebase (precisa da variável FIREBASE_SERVICE_ACCOUNT na Vercel). */
export function appAdmin(): App | null {
  const bruto = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!bruto) return null;
  if (getApps().length) return getApp();
  try {
    const chave = JSON.parse(bruto) as { project_id: string; client_email: string; private_key: string };
    return initializeApp({ credential: cert({ projectId: chave.project_id, clientEmail: chave.client_email, privateKey: chave.private_key.replace(/\\n/g, "\n") }) });
  } catch {
    return null;
  }
}

/** Manda notificação para os aparelhos que passarem no filtro. Devolve quantos receberam. */
export async function enviarPush(app: App, filtro: (t: { uid?: string; turma?: string; papel?: string }) => boolean, titulo: string, texto: string, link = "/"): Promise<number> {
  const db = getFirestore(app);
  const snap = await db.collection("pushTokens").get();
  const tokens = snap.docs.filter((d) => filtro(d.data() as { uid?: string; turma?: string; papel?: string })).map((d) => d.id);
  let enviados = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const lote = tokens.slice(i, i + 500);
    const r = await getMessaging(app).sendEachForMulticast({ tokens: lote, notification: { title: titulo.slice(0, 80), body: texto.slice(0, 180) }, webpush: { fcmOptions: { link }, notification: { icon: "/icon.png" } } });
    enviados += r.successCount;
    await Promise.all(r.responses.map((x, k) => (!x.success && /registration-token-not-registered|invalid-argument/.test(x.error?.code ?? "") ? db.doc(`pushTokens/${lote[k]}`).delete() : null)));
  }
  return enviados;
}
