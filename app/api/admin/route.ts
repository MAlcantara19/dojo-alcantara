import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";


/* Este arquivo roda no servidor da Vercel. Ele precisa da chave de serviço do Firebase na variável
   FIREBASE_SERVICE_ACCOUNT (veja o LEIA-ME). Só o administrador consegue usá-lo. */

function resposta(status: number, mensagem: string) {
  return Response.json({ mensagem }, { status });
}

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

export async function POST(req: Request) {
  const app = appAdmin();
  if (!app) return resposta(501, "O servidor do site ainda não tem a chave do Firebase. Siga o passo “chave de serviço” do LEIA-ME e publique de novo.");

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return resposta(401, "Entre de novo para continuar.");

  let uidChamador: string;
  try {
    uidChamador = (await getAuth(app).verifyIdToken(token)).uid;
  } catch {
    return resposta(401, "Sua sessão expirou. Entre de novo.");
  }

  const db = getFirestore(app);
  const eu = await db.doc(`users/${uidChamador}`).get();
  const papel = eu.exists ? String(eu.data()?.papel ?? "") : "";
  const ehAdmin = papel === "admin";
  if (!ehAdmin && papel !== "professor") return resposta(403, "Só a equipe pode fazer isso.");

  const corpo = (await req.json().catch(() => ({}))) as { acao?: string; uid?: string; senha?: string; email?: string };
  const uid = String(corpo.uid ?? "");
  if (!uid) return resposta(400, "Faltou dizer de qual conta.");

  try {
    if (corpo.acao === "senha") {
      // O professor só troca a senha de alunos das turmas dele.
      if (!ehAdmin) {
        const alvo = await db.doc(`users/${uid}`).get();
        const turmas = (eu.data()?.turmas ?? []) as string[];
        if (!alvo.exists || alvo.data()?.papel !== "aluno" || !turmas.includes(String(alvo.data()?.academia ?? ""))) return resposta(403, "Você só pode trocar a senha de alunos das suas turmas.");
      }
      const senha = String(corpo.senha ?? "");
      if (senha.length < 6) return resposta(400, "A senha precisa ter pelo menos 6 caracteres.");
      await getAuth(app).updateUser(uid, { password: senha });
      await db.doc(`users/${uid}`).update({ precisaTrocarSenha: true });
      await db.doc(`pedidosSenha/${String((await db.doc(`users/${uid}`).get()).data()?.login ?? "x").replace(/[^a-z0-9]/g, "_").slice(0, 100)}`).delete().catch(() => undefined);
      return resposta(200, "Senha trocada. A pessoa será convidada a escolher outra no próximo acesso.");
    }
    if (!ehAdmin) return resposta(403, "Só o administrador pode fazer isso.");
    if (corpo.acao === "email") {
      const email = String(corpo.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return resposta(400, "Esse e-mail não parece certo.");
      try {
        await getAuth(app).updateUser(uid, { email });
      } catch (e) {
        if ((e as { code?: string }).code === "auth/email-already-exists") return resposta(409, "Já existe outra conta com esse e-mail.");
        throw e;
      }
      await db.doc(`users/${uid}`).update({ email, login: email });
      return resposta(200, "E-mail de login trocado. A pessoa passa a entrar com ele (a senha continua a mesma).");
    }
    if (corpo.acao === "apagar") {
      if (uid === uidChamador) return resposta(400, "Por segurança, você não pode apagar a própria conta por aqui.");
      await db.recursiveDelete(db.doc(`users/${uid}`));
      await db.doc(`usersInterno/${uid}`).delete().catch(() => undefined);
      await getAuth(app).deleteUser(uid).catch((e: { code?: string }) => {
        if (e.code !== "auth/user-not-found") throw e;
      });
      return resposta(200, "Conta apagada.");
    }
    return resposta(400, "Ação desconhecida.");
  } catch {
    return resposta(500, "Não consegui concluir. Confira se a chave de serviço está correta e tente de novo.");
  }
}
