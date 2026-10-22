/* Leitura de agenda no formato iCal (.ics), usada pelo servidor do site. */
export type EventoAgenda = { id: string; titulo: string; data: string; hora: string; local: string; descricao: string };

const desescapar = (v: string) => v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");

/** Converte DTSTART em data (AAAA-MM-DD) e hora (HH:MM) no horário de Brasília. */
function quando(valor: string): { data: string; hora: string } | null {
  const m = valor.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, a, me, d, h, mi, , z] = m;
  if (!h) return { data: `${a}-${me}-${d}`, hora: "" };
  if (!z) return { data: `${a}-${me}-${d}`, hora: `${h}:${mi}` };
  const dt = new Date(Date.UTC(+a, +me - 1, +d, +h, +mi));
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(dt).map((x) => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}

export function lerIcs(texto: string): EventoAgenda[] {
  const linhas = texto.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const saida: EventoAgenda[] = [];
  let atual: Record<string, string> | null = null;
  for (const l of linhas) {
    if (l === "BEGIN:VEVENT") atual = {};
    else if (l === "END:VEVENT") {
      if (atual && atual.STATUS !== "CANCELLED") {
        const q = quando(atual.DTSTART ?? "");
        if (q) saida.push({ id: "g-" + (atual.UID ?? q.data + atual.SUMMARY).slice(0, 80), titulo: desescapar(atual.SUMMARY ?? "Evento").slice(0, 80), data: q.data, hora: q.hora, local: desescapar(atual.LOCATION ?? "").slice(0, 120), descricao: desescapar(atual.DESCRIPTION ?? "").slice(0, 400) });
      }
      atual = null;
    } else if (atual) {
      const i = l.indexOf(":");
      if (i > 0) atual[l.slice(0, i).split(";")[0].toUpperCase()] = l.slice(i + 1);
    }
  }
  return saida;
}
