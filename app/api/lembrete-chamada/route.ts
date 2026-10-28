import { getFirestore } from "firebase-admin/firestore";
import { appAdmin, enviarPush } from "../../lib/firebaseAdmin.server";

/*
 * Lembrete de chamada: a Vercel chama este endereço uma vez por dia (vercel.json).
 * Para cada turma com aula hoje e sem chamada feita, avisa os professores dela no celular.
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.get("authorization") !== `Bearer ${segredo}`) return Response.json({ mensagem: "não autorizado" }, { status: 401 });
  const app = appAdmin();
  if (!app) return Response.json({ mensagem: "sem chave de serviço" }, { status: 501 });
  const db = getFirestore(app);

  // Dia de hoje no horário de Brasília
  const partes = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const hoje = `${partes.year}-${partes.month}-${partes.day}`;
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(partes.weekday);

  const turmas = (await db.collection("turmas").get()).docs.map((d) => d.data() as { nome: string; apelido?: string; dias?: number[] }).filter((t) => (t.dias ?? []).includes(dia));
  const equipe = (await db.collection("users").where("papel", "in", ["professor", "admin"]).get()).docs.map((d) => ({ uid: d.id, turmas: (d.data().turmas ?? []) as string[] }));
  let avisos = 0;
  for (const t of turmas) {
    const feita = (await db.collection("chamadas").where("turma", "==", t.nome).where("data", "==", hoje).limit(1).get()).size > 0;
    if (feita) continue;
    const uids = equipe.filter((p) => p.turmas.includes(t.nome)).map((p) => p.uid);
    if (!uids.length) continue;
    avisos += await enviarPush(app, (x) => uids.includes(String(x.uid)), "📋 Hoje tem aula", `Turma ${t.apelido || t.nome}: toque para fazer a chamada.`, "/admin#chamada");
  }
  // Mensalidades em aberto: avisa os administradores X dias depois do vencimento e depois toda semana.
  const cfg = (await db.doc("config/site").get()).data() ?? {};
  const valor = Number(cfg.mensalidadeValor) || 0;
  const ocultas = (cfg.abasOcultas ?? []) as string[];
  if (valor > 0 && !ocultas.includes("mensalidades")) {
    const diaV = Number(cfg.vencimentoDia) || 10;
    const espera = Number(cfg.avisoAtrasoDias ?? 5);
    const mes = hoje.slice(0, 7);
    const passou = Math.round((Date.parse(hoje + "T12:00:00") - Date.parse(`${mes}-${String(diaV).padStart(2, "0")}T12:00:00`)) / 86400000);
    if (passou >= Math.max(1, espera) && (passou - espera) % 7 === 0) {
      const alunos = (await db.collection("users").where("papel", "==", "aluno").get()).docs.map((d) => d.id);
      const pagos = new Set((await db.collection("mensalidades").where("mes", "==", mes).get()).docs.filter((d) => d.data().pago).map((d) => d.data().uid as string));
      const devendo = alunos.filter((u) => !pagos.has(u)).length;
      if (devendo) avisos += await enviarPush(app, (x) => x.papel === "admin", "💳 Mensalidades em aberto", `${devendo} ${devendo === 1 ? "aluno ainda não pagou" : "alunos ainda não pagaram"} o mês (${passou} dias depois do vencimento).`, "/admin#mensalidades");
    }
  }
  return Response.json({ mensagem: "ok", turmas: turmas.length, avisos });
}
