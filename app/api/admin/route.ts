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

  const corpo = (await req.json().catch(() => ({}))) as { acao?: string; uid?: string; senha?: string; email?: string; dados?: string };

  // Ligar um login que já existe (por exemplo, apagado só do banco) a um cadastro novo no site.
  if (corpo.acao === "vincular") {
    if (!ehAdmin) return resposta(403, "Só o administrador pode fazer isso.");
    const login = String(corpo.email ?? "").trim().toLowerCase();
    let usuario;
    try {
      usuario = await getAuth(app).getUserByEmail(login);
    } catch {
      return resposta(404, "Não achei esse login no Firebase. Tente cadastrar normalmente.");
    }
    const ref = db.doc(`users/${usuario.uid}`);
    if ((await ref.get()).exists) return resposta(409, "Essa conta já tem cadastro no site. Procure em Alunos ou em Equipe.");
    const d = JSON.parse(String(corpo.dados ?? "{}")) as Record<string, unknown>;
    const papel = ["aluno", "professor", "admin"].includes(String(d.papel)) ? String(d.papel) : "aluno";
    const texto = (k: string, max: number) => String(d[k] ?? "").slice(0, max);
    await ref.set({
      nome: texto("nome", 100) || "Sem nome",
      apelido: texto("apelido", 40),
      dataNascimento: texto("dataNascimento", 10),
      faixa: texto("faixa", 30) || "Branca",
      faixaDesde: texto("faixaDesde", 10),
      dan: typeof d.dan === "number" ? d.dan : 0,
      academia: papel === "aluno" ? texto("academia", 60) : "",
      email: texto("email", 120),
      celular: texto("celular", 20),
      papel,
      turmas: papel === "professor" && Array.isArray(d.turmas) ? (d.turmas as unknown[]).map(String).slice(0, 30) : [],
      login,
      precisaTrocarSenha: true,
    });
    const senha = String(corpo.senha ?? "");
    if (senha.length >= 6) await getAuth(app).updateUser(usuario.uid, { password: senha });
    return resposta(200, "Conta ligada. A pessoa entra com esse login e a senha provisória.");
  }

  const uid = String(corpo.uid ?? "");
  if (!uid) return resposta(400, "Faltou dizer de qual conta.");

  try {
    if (corpo.acao === "senha") {
      // O professor troca a senha de qualquer aluno (nunca de professor ou administrador).
      if (!ehAdmin) {
        const alvo = await db.doc(`users/${uid}`).get();
        if (!alvo.exists || alvo.data()?.papel !== "aluno") return resposta(403, "Você só pode trocar a senha de alunos.");
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
