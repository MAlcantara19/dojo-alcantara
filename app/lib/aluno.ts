import { faixas } from "./faixas";
import type { Papel } from "./auth";

export type Aluno = {
  uid: string;
  nome: string;
  apelido?: string;
  dataNascimento: string; // AAAA-MM-DD
  faixa: string;
  faixaDesde?: string; // AAAA-MM-DD
  academia?: string;
  papel: Papel;
  email?: string;
  celular?: string;
  login?: string;
  precisaTrocarSenha?: boolean;
};

export function parseISO(s: string): Date {
  const [a, m, d] = s.split("-").map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
}

export function hojeISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

export function dataBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Idade de verdade, em anos completos. */
export function idade(nasc: string, hoje: Date): number {
  const n = parseISO(nasc);
  let i = hoje.getFullYear() - n.getFullYear();
  const jaFez = hoje.getMonth() > n.getMonth() || (hoje.getMonth() === n.getMonth() && hoje.getDate() >= n.getDate());
  if (!jaFez) i -= 1;
  return i;
}

/** Idade de campeonato: ano atual menos o ano de nascimento (muda em 1º de janeiro). */
export function anoCampeonato(nasc: string, hoje: Date): number {
  return hoje.getFullYear() - parseISO(nasc).getFullYear();
}

/** Dias até o próximo aniversário (0 = hoje). Quem nasceu em 29/02 comemora em 01/03 nos anos comuns. */
export function diasParaAniversario(nasc: string, hoje: Date): number {
  const n = parseISO(nasc);
  const dia0 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const alvoNoAno = (ano: number) => {
    const d = new Date(ano, n.getMonth(), n.getDate());
    return d.getMonth() !== n.getMonth() ? new Date(ano, 2, 1) : d;
  };
  let alvo = alvoNoAno(dia0.getFullYear());
  if (alvo < dia0) alvo = alvoNoAno(dia0.getFullYear() + 1);
  return Math.round((alvo.getTime() - dia0.getTime()) / 86400000);
}

export function mesesEntre(desde: string, hoje: Date): number {
  const d = parseISO(desde);
  let m = (hoje.getFullYear() - d.getFullYear()) * 12 + (hoje.getMonth() - d.getMonth());
  if (hoje.getDate() < d.getDate()) m -= 1;
  return Math.max(0, m);
}

export function indiceFaixa(nome?: string): number {
  return faixas.findIndex((f) => f.nome === nome);
}

/** Senha provisória fácil de ditar (sem letras parecidas como 0/O e 1/l). */
export function senhaProvisoria(tamanho = 8): string {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}
