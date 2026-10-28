import { getFirestore } from "firebase-admin/firestore";
import { appAdmin, enviarPush } from "../../lib/firebaseAdmin.server";

/* Pedido de aula experimental (página pública): grava e avisa a equipe no celular. */
export async function POST(req: Request) {
  const app = appAdmin();
  if (!app) return Response.json({ mensagem: "sem-servidor" }, { status: 501 });
  const c = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (String(c.site ?? "")) return Response.json({ mensagem: "ok" }); // campo-armadilha para robôs
  const t = (k: string, max: number) => String(c[k] ?? "").trim().slice(0, max);
  const menor = c.menor === true;
  const d = { nome: t("nome", 100), idade: t("idade", 20), telefone: t("telefone", 20).replace(/\D/g, ""), turma: t("turma", 100), horario: t("horario", 100), mensagem: t("mensagem", 600), menor, responsavel: menor ? t("responsavel", 100) : "", telResponsavel: menor ? t("telResponsavel", 20).replace(/\D/g, "") : "", status: "Novo", obs: "", ts: Date.now() };
  if (d.nome.length < 2 || d.telefone.length < 10 || c.consente !== true) return Response.json({ mensagem: "Preencha nome e telefone com DDD e marque a autorização de contato." }, { status: 400 });
  if (menor && d.responsavel.length < 2) return Response.json({ mensagem: "Para menores de idade, preencha o nome do responsável." }, { status: 400 });
  await getFirestore(app).collection("experimentais").add(d);
  // Opcional: mensagem automática no WhatsApp do sensei (serviço gratuito CallMeBot; ver LEIA-ME).
  const zap = process.env.CALLMEBOT_PHONE;
  const chave = process.env.CALLMEBOT_APIKEY;
  if (zap && chave) {
    const texto = `🥋 Aula experimental: ${d.nome}${d.idade ? ` (${d.idade})` : ""}\nTel: ${d.telefone}${menor ? `\nResponsável: ${d.responsavel} ${d.telResponsavel}` : ""}${d.turma ? `\nTurma: ${d.turma}` : ""}${d.horario ? `\nHorário: ${d.horario}` : ""}${d.mensagem ? `\nObs: ${d.mensagem}` : ""}`;
    await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(zap)}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(chave)}`).catch(() => null);
  }
  await enviarPush(app, (x) => x.papel === "admin" || x.papel === "professor", "🥋 Pedido de aula experimental", `${d.nome}${d.idade ? `, ${d.idade}` : ""}${d.turma ? ` · ${d.turma}` : ""}`, "/admin#experimentais").catch(() => 0);
  return Response.json({ mensagem: "ok" });
}
