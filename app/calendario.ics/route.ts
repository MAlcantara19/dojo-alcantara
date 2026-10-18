import { connection } from "next/server";
import { gerarICS, type EventoICS } from "../lib/ics";

type Campo = { stringValue?: string };
type Doc = { name: string; fields?: Record<string, Campo> };

const URL_EVENTOS =
  "https://firestore.googleapis.com/v1/projects/dojo-alcantara/databases/(default)/documents/eventos?pageSize=300";

export async function GET() {
  await connection(); // sempre buscar dados novos, nunca guardar uma cópia antiga

  let docs: Doc[];
  try {
    const r = await fetch(URL_EVENTOS, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    docs = ((await r.json()) as { documents?: Doc[] }).documents ?? [];
  } catch {
    // Em caso de falha, não devolver um calendário vazio (apagaria o do celular).
    return new Response("Calendário indisponível no momento.", { status: 503 });
  }

  const eventos: EventoICS[] = docs.map((d) => ({
    id: d.name.split("/").pop() ?? "evento",
    titulo: d.fields?.titulo?.stringValue ?? "Evento",
    data: d.fields?.data?.stringValue ?? "",
    hora: d.fields?.hora?.stringValue,
    local: d.fields?.local?.stringValue,
    tipo: d.fields?.tipo?.stringValue,
  }));

  return new Response(gerarICS(eventos), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=900",
    },
  });
}
