export type Feriado = { data: string; nome: string; facultativo?: boolean; local?: boolean };

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const somar = (d: Date, dias: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias);

/** Feriados nacionais do ano, mais Carnaval e Corpus Christi (pontos facultativos). */
export function feriadosNacionais(ano: number): Feriado[] {
  const p = pascoa(ano);
  const f = (m: number, d: number, nome: string): Feriado => ({ data: `${ano}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, nome });
  return [
    f(1, 1, "Confraternização Universal"),
    { data: iso(somar(p, -48)), nome: "Carnaval (ponto facultativo)", facultativo: true },
    { data: iso(somar(p, -47)), nome: "Carnaval (ponto facultativo)", facultativo: true },
    { data: iso(somar(p, -2)), nome: "Sexta-feira Santa" },
    f(4, 21, "Tiradentes"),
    f(5, 1, "Dia do Trabalho"),
    { data: iso(somar(p, 60)), nome: "Corpus Christi (ponto facultativo)", facultativo: true },
    f(9, 7, "Independência do Brasil"),
    f(10, 12, "Nossa Senhora Aparecida"),
    f(11, 2, "Finados"),
    f(11, 15, "Proclamação da República"),
    f(11, 20, "Dia da Consciência Negra"),
    f(12, 25, "Natal"),
  ];
}
