import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

/* Manda notificação no celular para todos, para turmas ou para pessoas. Só a equipe usa. */

function appAdmin(): App | null {
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
const resposta = (status: number, mensagem: string, enviados = 0) => Response.json({ mensagem, enviados }, { status });

export async function POST(req: Request) {
  const app = appAdmin();
  if (!app) return resposta(501, "O servidor ainda não tem a chave de serviço do Firebase.");
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return resposta(401, "Entre de novo.");
  let uid: string;
  try {
    uid = (await getAuth(app).verifyIdToken(token)).uid;
  } catch {
    return resposta(401, "Sessão expirada.");
  }
  const db = getFirestore(app);
  const papel = (await db.doc(`users/${uid}`).get()).data()?.papel;
  if (papel !== "admin" && papel !== "professor") return resposta(403, "Só a equipe manda notificações.");

  const c = (await req.json().catch(() => ({}))) as { titulo?: string; texto?: string; link?: string; turmas?: string[]; uids?: string[] };
  const titulo = String(c.titulo ?? "").slice(0, 80);
  const texto = String(c.texto ?? "").slice(0, 180);
  const link = String(c.link ?? "/").startsWith("/") ? String(c.link ?? "/") : "/";
  if (!titulo) return resposta(400, "Faltou o título.");

  const snap = await db.collection("pushTokens").get();
  const turmas = Array.isArray(c.turmas) ? c.turmas.map(String) : [];
  const uids = Array.isArray(c.uids) ? c.uids.map(String) : [];
  const alvos = snap.docs.filter((d) => {
    const x = d.data() as { uid?: string; turma?: string; papel?: string };
    if (uids.length) return uids.includes(String(x.uid));
    if (turmas.length) return turmas.includes(String(x.turma)) || x.papel === "admin";
    return true;
  });
  const tokens = alvos.map((d) => d.id);
  let enviados = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const lote = tokens.slice(i, i + 500);
    const r = await getMessaging(app).sendEachForMulticast({
      tokens: lote,
      notification: { title: titulo, body: texto },
      webpush: { fcmOptions: { link }, notification: { icon: "/icon.png", badge: "/icon.png" } },
    });
    enviados += r.successCount;
    // Limpa os celulares que desinstalaram ou trocaram o token
    await Promise.all(
      r.responses.map((x, k) => (!x.success && /registration-token-not-registered|invalid-argument/.test(x.error?.code ?? "") ? db.doc(`pushTokens/${lote[k]}`).delete() : null)),
    );
  }
  return resposta(200, `Notificação enviada para ${enviados} ${enviados === 1 ? "aparelho" : "aparelhos"}.`, enviados);
}
