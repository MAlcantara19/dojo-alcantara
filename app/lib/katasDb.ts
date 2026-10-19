import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import { katas as katasPadrao, type SerieKata } from "./katas";

export type Video = { titulo: string; url: string };
export type Imagem = { legenda: string; url: string };
export type KataDoc = { id: string; nome: string; dan: string; resumo: string; custom: boolean; videos: Video[]; imagens: Imagem[]; series: SerieKata[] };

export const idDoKata = (nome: string) => nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Só aceita endereços https://, arquivos do próprio site (/img/...) ou fotos enviadas pelo painel (db:...). */
export const enderecoOk = (u: string) => /^https:\/\/\S+$/.test(u) || /^\/[A-Za-z0-9_./-]+$/.test(u) || /^db:[A-Za-z0-9]{8,40}$/.test(u);

export async function lerKatasDb(): Promise<Record<string, Partial<KataDoc>>> {
  const snap = await getDocs(collection(getDb(), "katas"));
  const m: Record<string, Partial<KataDoc>> = {};
  snap.docs.forEach((d) => {
    m[d.id] = d.data() as Partial<KataDoc>;
  });
  return m;
}

/** Junta os katas padrão com o que foi editado e os cards criados pelo professor. */
export function montarKatas(db: Record<string, Partial<KataDoc>>): KataDoc[] {
  const txt = (v: unknown, padrao: string) => (typeof v === "string" ? v : padrao);
  const padrao = katasPadrao.map((k) => {
    const id = idDoKata(k.nome);
    const d = db[id] ?? {};
    const series = Array.isArray(d.series) && d.series.length ? d.series : k.series;
    return { id, nome: txt(d.nome, k.nome) || k.nome, dan: txt(d.dan, k.dan), resumo: txt(d.resumo, k.resumo), custom: false, videos: d.videos ?? [], imagens: d.imagens ?? [], series };
  });
  const extras = Object.entries(db)
    .filter(([, d]) => d.custom)
    .map(([id, d]) => ({ id, nome: d.nome ?? id, dan: d.dan ?? "", resumo: d.resumo ?? "", custom: true, videos: d.videos ?? [], imagens: d.imagens ?? [], series: Array.isArray(d.series) ? d.series : [] }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return [...padrao, ...extras];
}

/** Séries em texto: um bloco por série (separados por linha em branco); 1ª linha = título, depois uma técnica por linha ("Nome | explicação"). */
export function seriesParaTexto(series: SerieKata[]): string {
  return series.map((s) => [s.titulo, ...s.tecnicas.map((t) => (t.desc ? `${t.nome} | ${t.desc}` : t.nome))].join("\n")).join("\n\n");
}
export function textoParaSeries(texto: string): SerieKata[] {
  return texto
    .split(/\n\s*\n/)
    .map((bloco) => bloco.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((l) => l.length > 0)
    .map(([titulo, ...resto]) => ({
      titulo,
      tecnicas: resto.map((l) => {
        const i = l.indexOf("|");
        return i >= 0 ? { nome: l.slice(0, i).trim(), desc: l.slice(i + 1).trim() || undefined } : { nome: l };
      }),
    }));
}

export async function salvarTextosKata(id: string, d: { nome: string; dan: string; resumo: string; series: SerieKata[] }) {
  await setDoc(doc(getDb(), "katas", id), d, { merge: true });
}

export async function salvarMidiaKata(id: string, videos: Video[], imagens: Imagem[]) {
  await setDoc(doc(getDb(), "katas", id), { videos, imagens }, { merge: true });
}
export async function criarCardKata(nome: string, dan: string, resumo: string) {
  await addDoc(collection(getDb(), "katas"), { nome, dan, resumo, custom: true, videos: [], imagens: [], criadoEm: serverTimestamp() });
}
export const apagarCardKata = (id: string) => deleteDoc(doc(getDb(), "katas", id));
