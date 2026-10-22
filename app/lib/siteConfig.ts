import { AJUSTE_PADRAO, lerAjuste, type Ajuste } from "./fotoAjuste";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { dojo, sobre } from "./data";
import { getDb } from "./firebase";
import { useCarga } from "./useCarga";

export type Transicao = "nenhuma" | "suave" | "subir" | "zoom" | "deslizar";
export const TRANSICOES: { valor: Transicao; rotulo: string }[] = [
  { valor: "nenhuma", rotulo: "Nenhum" },
  { valor: "suave", rotulo: "Surgir suave" },
  { valor: "subir", rotulo: "Subir" },
  { valor: "zoom", rotulo: "Zoom" },
  { valor: "deslizar", rotulo: "Deslizar da direita" },
];
export type Efeitos = { movimento: boolean; kanji: boolean; brilho: boolean; intro: boolean; ondinha: boolean; tilt: boolean; rolagem: boolean; transicao: Transicao };
export type SiteConfig = {
  nome: string;
  slogan: string;
  logoUrl: string;
  bannerUrl: string;
  logoAjuste: Ajuste;
  bannerAjuste: Ajuste;
  instagram: string;
  whatsapp: string;
  emailContato: string;
  sobre: string[];
  efeitos: Efeitos;
  drivePasta: string;
  driveFichas: string;
  driveChave: string;
  diasDestaque: number;
  faixasPublicas: string[];
};

export const siteBase: SiteConfig = {
  nome: dojo.nome,
  slogan: dojo.slogan,
  logoUrl: "",
  bannerUrl: "",
  logoAjuste: AJUSTE_PADRAO,
  bannerAjuste: AJUSTE_PADRAO,
  instagram: dojo.contato.instagram,
  whatsapp: dojo.contato.whatsapp,
  emailContato: "",
  sobre,
  efeitos: { movimento: true, kanji: true, brilho: true, intro: true, ondinha: true, tilt: true, rolagem: true, transicao: "subir" },
  drivePasta: "",
  driveFichas: "",
  driveChave: "",
  diasDestaque: 7,
  faixasPublicas: ["Azul"],
};

let cache: Promise<Partial<SiteConfig>> | null = null;

/** Lê uma vez só e reaproveita (Shell e Home usam a mesma leitura). */
export function lerSite(): Promise<Partial<SiteConfig>> {
  if (!cache) {
    cache = getDoc(doc(getDb(), "config", "site"))
      .then((s) => (s.exists() ? (s.data() as Partial<SiteConfig>) : {}))
      .catch(() => ({}));
  }
  return cache;
}

export async function salvarSite(c: SiteConfig) {
  await setDoc(doc(getDb(), "config", "site"), c);
  cache = null;
}

export function mesclar(p: Partial<SiteConfig>): SiteConfig {
  const str = (v: unknown, padrao: string) => (typeof v === "string" ? v : padrao);
  return {
    nome: str(p.nome, siteBase.nome) || siteBase.nome,
    slogan: str(p.slogan, siteBase.slogan),
    logoUrl: str(p.logoUrl, ""),
    bannerUrl: str(p.bannerUrl, ""),
    logoAjuste: lerAjuste(p.logoAjuste),
    bannerAjuste: lerAjuste(p.bannerAjuste),
    instagram: str(p.instagram, siteBase.instagram),
    whatsapp: str(p.whatsapp, siteBase.whatsapp),
    emailContato: str(p.emailContato, ""),
    sobre: Array.isArray(p.sobre) && p.sobre.length ? p.sobre.filter((x): x is string => typeof x === "string") : siteBase.sobre,
    efeitos: {
      movimento: p.efeitos?.movimento !== false,
      kanji: p.efeitos?.kanji !== false,
      brilho: p.efeitos?.brilho !== false,
      intro: p.efeitos?.intro !== false,
      ondinha: p.efeitos?.ondinha !== false,
      tilt: p.efeitos?.tilt !== false,
      rolagem: p.efeitos?.rolagem !== false,
      transicao: TRANSICOES.some((t) => t.valor === p.efeitos?.transicao) ? (p.efeitos?.transicao as Transicao) : "subir",
    },
    drivePasta: str(p.drivePasta, ""),
    driveFichas: str(p.driveFichas, ""),
    driveChave: str(p.driveChave, ""),
    faixasPublicas: Array.isArray(p.faixasPublicas) ? p.faixasPublicas.filter((x): x is string => typeof x === "string") : ["Azul"],
    diasDestaque: typeof p.diasDestaque === "number" && p.diasDestaque >= 1 && p.diasDestaque <= 60 ? Math.round(p.diasDestaque) : 7,
  };
}

const VAZIO: Partial<SiteConfig> = {};
export function useSite(): SiteConfig {
  const c = useCarga(lerSite, VAZIO);
  return mesclar(c.dados);
}

export const siglaDe = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
