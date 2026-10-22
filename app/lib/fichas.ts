"use client";

import { useMemo } from "react";
import { katas } from "./katas";
import { faixas as listaFaixas } from "./faixas";
import { idDoKata } from "./katasDb";
import { idDaPastaDrive } from "./links";
import { useSite } from "./siteConfig";
import { tecnicas } from "./tecnicas";
import { useCarga } from "./useCarga";

export type Ficha = { imagem?: string; pdf?: string };
export type ArquivoFicha = { id: string; name: string; mimeType: string };

/** Tira acento, extensão, “(1)”, “cópia” e símbolos: “Kesa Gatame (2).JPG” vira “kesagatame”. */
export function normalizar(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/, "")
    .replace(/\(\d+\)/g, "")
    .replace(/\bcopia\b|\bcopy\b/g, "")
    .replace(/barai/g, "harai")
    .replace(/[^a-z0-9]/g, "");
}

function distancia(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const chaves = [
  ...tecnicas.map((t) => ({ id: t.id, nome: t.nome, chave: normalizar(t.nome) })),
  // Os katas também podem ter ficha na mesma pasta (ex.: “Nage no kata.pdf”).
  ...katas.map((k) => ({ id: "kata:" + idDoKata(k.nome), nome: k.nome, chave: normalizar(k.nome) })),
];

/** Acha a técnica do arquivo: igual, ou muito parecida (1 ou 2 letras de diferença, sem empate). */
export function casar(nomeArquivo: string): { id?: string; nome?: string; sugestao?: string } {
  const k = normalizar(nomeArquivo);
  if (!k) return {};
  const exata = chaves.find((c) => c.chave === k);
  if (exata) return { id: exata.id, nome: exata.nome };
  const ordem = chaves.map((c) => ({ c, d: distancia(k, c.chave) })).sort((x, y) => x.d - y.d);
  const [m1, m2] = ordem;
  const limite = k.length >= 11 ? 2 : k.length >= 7 ? 1 : 0;
  if (m1.d <= limite && (!m2 || m2.d > m1.d)) return { id: m1.c.id, nome: m1.c.nome };
  return m1.d <= 4 ? { sugestao: m1.c.nome } : {};
}

export function montarFichas(arquivos: ArquivoFicha[]) {
  const mapa: Record<string, Ficha> = {};
  const faixas: Record<string, Ficha> = {};
  const semCorrespondencia: { name: string; sugestao?: string }[] = [];
  const lista: { id: string; name: string; pdf: boolean; ligadoA: string; sugestao?: string }[] = [];
  let ligados = 0;
  [...arquivos].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).forEach((a) => {
    // Ficha da faixa inteira: o nome do arquivo tem “faixa” + a cor (ex.: “Fichas - Faixa Azul.pdf”).
    const k = normalizar(a.name);
    const daFaixa = listaFaixas.find((fx) => k.includes("faixa" + normalizar(fx.nome)));
    if (daFaixa) {
      lista.push({ id: a.id, name: a.name, pdf: a.mimeType === "application/pdf", ligadoA: `Ficha da faixa ${daFaixa.nome.toLowerCase()}` });
      const ff = (faixas[daFaixa.nome] ??= {});
      if (a.mimeType === "application/pdf") ff.pdf ??= `https://drive.google.com/file/d/${a.id}/view`;
      else ff.imagem ??= `https://drive.google.com/thumbnail?id=${a.id}&sz=w1000`;
      ligados += 1;
      return;
    }
    const r = casar(a.name);
    if (!r.id) {
      semCorrespondencia.push({ name: a.name, sugestao: r.sugestao });
      lista.push({ id: a.id, name: a.name, pdf: a.mimeType === "application/pdf", ligadoA: "", sugestao: r.sugestao });
      return;
    }
    lista.push({ id: a.id, name: a.name, pdf: a.mimeType === "application/pdf", ligadoA: r.id });
    const f = (mapa[r.id] ??= {});
    if (a.mimeType === "application/pdf") f.pdf ??= `https://drive.google.com/file/d/${a.id}/view`;
    else f.imagem ??= `https://drive.google.com/thumbnail?id=${a.id}&sz=w1000`;
    ligados += 1;
  });
  return { mapa, faixas, semCorrespondencia, ligados, lista };
}

/* ---------- Leitura da pasta (com cache de 5 minutos) ---------- */
const cache = new Map<string, { t: number; p: Promise<ArquivoFicha[]> }>();

export function limparCacheFichas() {
  cache.clear();
}

export async function lerPastaFichas(pasta: string, chave: string): Promise<ArquivoFicha[]> {
  const q = `'${pasta}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = 'application/pdf')`;
  const params = new URLSearchParams({ q, pageSize: "300", fields: "files(id,name,mimeType)", key: chave });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  if (!r.ok) throw new Error(String(r.status));
  return ((await r.json()) as { files?: ArquivoFicha[] }).files ?? [];
}

function comCache(pasta: string, chave: string) {
  const k = pasta + "|" + chave;
  const e = cache.get(k);
  if (e && Date.now() - e.t < 300000) return e.p;
  const p = lerPastaFichas(pasta, chave);
  p.catch(() => cache.delete(k));
  cache.set(k, { t: Date.now(), p });
  return p;
}

const VAZIO: ArquivoFicha[] = [];

/** Fichas da pasta do Drive ligadas às técnicas pelo nome do arquivo. */
export function useFichas() {
  const site = useSite();
  const pasta = idDaPastaDrive(site.driveFichas);
  const usa = Boolean(pasta && site.driveChave);
  const c = useCarga(() => comCache(pasta, site.driveChave), VAZIO, usa);
  const resumo = useMemo(() => montarFichas(c.dados), [c.dados]);
  return { ...resumo, total: c.dados.length, usa, carregando: usa && c.carregando, erro: usa && c.erro, recarregar: c.recarregar };
}

/** Teste de conexão com uma pasta do Drive, com mensagem em português. */
export async function testarDrive(pastaEntrada: string, chave: string): Promise<string> {
  const pasta = idDaPastaDrive(pastaEntrada);
  if (!pasta || !chave) return "Preencha o link da pasta e a chave antes de testar.";
  try {
    const q = `'${pasta}' in parents and trashed = false`;
    const params = new URLSearchParams({ q, pageSize: "100", fields: "files(id,mimeType)", key: chave });
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    if (r.ok) {
      const j = (await r.json()) as { files?: { mimeType: string }[] };
      const n = j.files?.length ?? 0;
      const imgs = (j.files ?? []).filter((f) => f.mimeType.startsWith("image/")).length;
      return n === 0 ? "Conexão OK, mas a pasta está vazia (ou o compartilhamento não é “Qualquer pessoa com o link”)." : `Conexão OK: ${n} arquivos na pasta, sendo ${imgs} imagens.`;
    }
    const corpo = (await r.json().catch(() => ({}))) as { error?: { message?: string; errors?: { reason?: string }[] } };
    const razao = corpo.error?.errors?.[0]?.reason ?? "";
    const texto = (corpo.error?.message ?? "").toLowerCase();
    if (r.status === 400) return "A chave não foi aceita. Confira se copiou a chave inteira.";
    if (r.status === 403 && (texto.includes("referer") || razao === "forbidden" || texto.includes("blocked")))
      return "O Google bloqueou o acesso. Confira nas restrições da chave se o site https://dojo-alcantara.vercel.app/* (e http://localhost:3000/*) estão na lista e se a Google Drive API está ativada. A mudança pode levar alguns minutos.";
    if (r.status === 403) return "Sem permissão (403). Ative a Google Drive API no projeto e confira as restrições da chave.";
    if (r.status === 404) return "Pasta não encontrada. Confira o link e se ela está compartilhada como “Qualquer pessoa com o link”.";
    return `O Google respondeu com erro ${r.status}.`;
  } catch {
    return "Não consegui falar com o Google. Confira a internet e tente de novo.";
  }
}
