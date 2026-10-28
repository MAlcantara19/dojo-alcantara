import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { appAdmin } from "../../lib/firebaseAdmin.server";

/*
 * Gera perguntas de simulado com IA (Claude, da Anthropic). Só a equipe usa.
 * Precisa da variável ANTHROPIC_API_KEY na Vercel (conta paga na Anthropic: custa centavos por simulado).
 */
const responder = (status: number, corpo: object) => Response.json(corpo, { status });

export async function POST(req: Request) {
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) return responder(501, { mensagem: "A IA ainda não foi ligada: falta a variável ANTHROPIC_API_KEY na Vercel (veja o LEIA-ME)." });
  const app = appAdmin();
  if (!app) return responder(501, { mensagem: "Falta a chave de serviço do Firebase na Vercel." });
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  try {
    const uid = (await getAuth(app).verifyIdToken(token ?? "")).uid;
    const papel = (await getFirestore(app).doc(`users/${uid}`).get()).data()?.papel;
    if (papel !== "admin" && papel !== "professor") return responder(403, { mensagem: "Só a equipe usa o gerador." });
  } catch {
    return responder(401, { mensagem: "Entre de novo." });
  }

  const c = (await req.json().catch(() => ({}))) as { tema?: string; quantidade?: number; alternativas?: number; publico?: string };
  const tema = String(c.tema ?? "").slice(0, 300);
  const qtd = Math.min(20, Math.max(3, Number(c.quantidade) || 10));
  const alt = Math.min(5, Math.max(3, Number(c.alternativas) || 4));
  const publico = String(c.publico ?? "alunos de judô").slice(0, 100);
  if (tema.length < 3) return responder(400, { mensagem: "Escreva o tema do simulado." });

  const instrucoes = `Você é um sensei de judô brasileiro, faixa preta, que escreve simulados para alunos. Escreva em português do Brasil.
Use os nomes oficiais do Kodokan (ex.: Seoi-nage, O-soto-gari, Kesa-gatame) e as regras atuais da Federação Internacional de Judô quando o tema for regras.
Se não tiver certeza de um fato, NÃO invente: prefira perguntas sobre o que é amplamente conhecido.
Responda SOMENTE com JSON válido, sem texto antes ou depois, no formato:
{"titulo":"...","descricao":"...","perguntas":[{"pergunta":"...","opcoes":["...","..."],"correta":0,"explicacao":"por que a certa está certa","porque":["por que a opção 0 está errada (vazio na certa)","..."]}]}
Cada pergunta tem exatamente ${alt} opções, uma só correta (índice em "correta", variando a posição), e "porque" com ${alt} textos curtos (texto vazio na posição da correta).`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": chave, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-5-5",
      max_tokens: 6000,
      system: instrucoes,
      messages: [{ role: "user", content: `Tema: ${tema}\nPúblico: ${publico}\nQuantidade de perguntas: ${qtd}` }],
    }),
  }).catch(() => null);
  if (!r || !r.ok) return responder(502, { mensagem: `A IA não respondeu agora (${r?.status ?? "sem conexão"}). Tente de novo em instantes.` });
  const j = (await r.json()) as { content?: { type: string; text?: string }[] };
  const texto = (j.content ?? []).map((x) => x.text ?? "").join("").replace(/```json|```/g, "").trim();
  try {
    const dados = JSON.parse(texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1)) as { titulo?: string; descricao?: string; perguntas?: { pergunta: string; opcoes: string[]; correta: number; explicacao: string; porque?: string[] }[] };
    const perguntas = (dados.perguntas ?? [])
      .filter((p) => p.pergunta && Array.isArray(p.opcoes) && p.opcoes.length >= 2 && p.correta >= 0 && p.correta < p.opcoes.length)
      .slice(0, qtd)
      .map((p) => ({ pergunta: String(p.pergunta).slice(0, 300), opcoes: p.opcoes.map((o) => String(o).slice(0, 150)), correta: p.correta, explicacao: String(p.explicacao ?? "").slice(0, 400), porque: Array.isArray(p.porque) ? p.porque.map((x) => String(x ?? "").slice(0, 300)) : undefined }));
    if (!perguntas.length) throw new Error("vazio");
    return responder(200, { titulo: String(dados.titulo ?? tema).slice(0, 80), descricao: String(dados.descricao ?? "").slice(0, 200), perguntas });
  } catch {
    return responder(502, { mensagem: "A IA respondeu num formato estranho. Tente de novo." });
  }
}
