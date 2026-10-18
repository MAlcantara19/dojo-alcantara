export type EventoICS = { id: string; titulo: string; data: string; hora?: string; local?: string; tipo?: string };

function esc(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Linhas do iCalendar têm no máximo 75 bytes; o excesso continua na linha seguinte.
function dobrar(linha: string): string {
  const enc = new TextEncoder();
  if (enc.encode(linha).length <= 75) return linha;
  const partes: string[] = [];
  let atual = "";
  for (const ch of linha) {
    const limite = partes.length === 0 ? 75 : 74;
    if (enc.encode(atual + ch).length > limite) {
      partes.push(atual);
      atual = ch;
    } else {
      atual += ch;
    }
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

function soDigitos(iso: string): string {
  return iso.replace(/-/g, "");
}

function diaSeguinte(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + 1));
  return `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(2, "0")}${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function gerarICS(eventos: EventoICS[], agora: Date = new Date()): string {
  const carimbo = agora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dojo Alcantara//Calendario//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Dojô Alcântara",
    "X-WR-TIMEZONE:America/Sao_Paulo",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of eventos) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.data)) continue;
    const detalhes = [e.tipo ? `Tipo: ${e.tipo}` : "", e.hora ? `Horário: ${e.hora}` : ""].filter(Boolean).join("\n");
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@dojoalcantara`,
      `DTSTAMP:${carimbo}`,
      `DTSTART;VALUE=DATE:${soDigitos(e.data)}`,
      `DTEND;VALUE=DATE:${diaSeguinte(e.data)}`,
      `SUMMARY:${esc(e.titulo)}`,
    );
    if (e.local && e.local !== "A definir") linhas.push(`LOCATION:${esc(e.local)}`);
    if (detalhes) linhas.push(`DESCRIPTION:${esc(detalhes)}`);
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR");
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}

/** Link que abre o Google Agenda já com o evento preenchido. */
export function linkGoogleAgenda(e: EventoICS): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titulo,
    dates: `${soDigitos(e.data)}/${diaSeguinte(e.data)}`,
    details: [e.tipo ? `Tipo: ${e.tipo}` : "", e.hora ? `Horário: ${e.hora}` : ""].filter(Boolean).join("\n"),
  });
  if (e.local && e.local !== "A definir") p.set("location", e.local);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
