import { firebaseConfig } from "../../lib/firebase";
import { lerIcs } from "../../lib/ics.server";

/* Lê a agenda do Google (endereço público iCal salvo no painel) e devolve os eventos para o calendário do site. */
export async function GET() {
  const vazio = (motivo: string) => Response.json({ eventos: [], motivo }, { headers: { "Cache-Control": "s-maxage=300" } });
  try {
    const cfg = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/config/site?key=${firebaseConfig.apiKey}`, { cache: "no-store" });
    if (!cfg.ok) return vazio("sem-config");
    const j = (await cfg.json()) as { fields?: { agendaIcs?: { stringValue?: string } } };
    const url = j.fields?.agendaIcs?.stringValue ?? "";
    // Só aceita endereços do Google Agenda (evita o servidor buscar qualquer coisa).
    if (!/^https:\/\/calendar\.google\.com\/calendar\/ical\/[^\s]+\.ics$/.test(url)) return vazio("sem-agenda");
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return vazio("agenda-indisponivel");
    const hoje = Date.now();
    const eventos = lerIcs(await r.text()).filter((e) => {
      const t = Date.parse(e.data + "T12:00:00");
      return t > hoje - 120 * 86400000 && t < hoje + 400 * 86400000;
    });
    return Response.json({ eventos }, { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return vazio("erro");
  }
}
