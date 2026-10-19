import { doc, getDoc, setDoc } from "firebase/firestore";
import { dojo, sobre } from "./data";
import { getDb } from "./firebase";
import { useCarga } from "./useCarga";

export type Efeitos = { movimento: boolean; kanji: boolean; brilho: boolean };
export type SiteConfig = {
  nome: string;
  slogan: string;
  logoUrl: string;
  bannerUrl: string;
  instagram: string;
  whatsapp: string;
  sobre: string[];
  efeitos: Efeitos;
  drivePasta: string;
  driveChave: string;
  diasDestaque: number;
};

export const siteBase: SiteConfig = {
  nome: dojo.nome,
  slogan: dojo.slogan,
  logoUrl: "",
  bannerUrl: "",
  instagram: dojo.contato.instagram,
  whatsapp: dojo.contato.whatsapp,
  sobre,
  efeitos: { movimento: true, kanji: true, brilho: true },
  drivePasta: "",
  driveChave: "",
  diasDestaque: 7,
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
    instagram: str(p.instagram, siteBase.instagram),
    whatsapp: str(p.whatsapp, siteBase.whatsapp),
    sobre: Array.isArray(p.sobre) && p.sobre.length ? p.sobre.filter((x): x is string => typeof x === "string") : siteBase.sobre,
    efeitos: {
      movimento: p.efeitos?.movimento !== false,
      kanji: p.efeitos?.kanji !== false,
      brilho: p.efeitos?.brilho !== false,
    },
    drivePasta: str(p.drivePasta, ""),
    driveChave: str(p.driveChave, ""),
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
