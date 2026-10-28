import { getFirestore } from "firebase-admin/firestore";
import { appAdmin, enviarPush } from "../../lib/firebaseAdmin.server";

/* Pedido de aula experimental (página pública): grava e avisa a equipe no celular. */
export async function POST(req: Request) {
  const app = appAdmin();
  if (!app) return Response.json({ mensagem: "sem-servidor" }, { status: 501 });
  const c = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (String(c.site ?? "")) return Response.json({ mensagem: "ok" }); // campo-armadilha para robôs
  const t = (k: string, max: number) => String(c[k] ?? "").trim().slice(0, max);
  const d = { nome: t("nome", 100), idade: t("idade", 20), telefone: t("telefone", 20).replace(/\D/g, ""), turma: t("turma", 100), horario: t("horario", 100), mensagem: t("mensagem", 600), status: "Novo", obs: "", ts: Date.now() };
  if (d.nome.length < 2 || d.telefone.length < 10 || c.consente !== true) return Response.json({ mensagem: "Preencha nome e telefone com DDD e marque a autorização de contato." }, { status: 400 });
  await getFirestore(app).collection("experimentais").add(d);
  await enviarPush(app, (x) => x.papel === "admin" || x.papel === "professor", "🥋 Pedido de aula experimental", `${d.nome}${d.idade ? `, ${d.idade}` : ""}${d.turma ? ` · ${d.turma}` : ""}`, "/admin#experimentais").catch(() => 0);
  return Response.json({ mensagem: "ok" });
}
