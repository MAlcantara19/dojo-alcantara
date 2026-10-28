import { AJUSTE_PADRAO, lerAjuste, type Ajuste } from "./fotoAjuste";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { dojo, sobre } from "./data";
import { getDb } from "./firebase";
import { useCarga } from "./useCarga";

export type Transicao = "nenhuma" | "suave" | "subir" | "zoom" | "deslizar" | "girar" | "desfocar" | "cortina" | "quique";
export const TRANSICOES: { valor: Transicao; rotulo: string }[] = [
  { valor: "nenhuma", rotulo: "Nenhum" },
  { valor: "suave", rotulo: "Surgir suave" },
  { valor: "subir", rotulo: "Subir" },
  { valor: "zoom", rotulo: "Zoom" },
  { valor: "deslizar", rotulo: "Deslizar da direita" },
  { valor: "girar", rotulo: "Girar em 3D" },
  { valor: "desfocar", rotulo: "Sair do desfoque" },
  { valor: "cortina", rotulo: "Abrir em círculo" },
  { valor: "quique", rotulo: "Subir com quique" },
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
  faixasPublicasRoleta: string[];
  aulasPorGrau: number;
  grausPorFaixa: number;
  agendaIcs: string;
  vapidKey: string;
  abasOcultas: string[];
  mensalidadeValor: number;
  vencimentoDia: number;
  multaPct: number;
  jurosMesPct: number;
  avisoAtrasoDias: number;
  callmebot: boolean;
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
  faixasPublicasRoleta: ["Azul", "Amarela"],
  aulasPorGrau: 9,
  grausPorFaixa: 4,
  agendaIcs: "",
  vapidKey: "",
  abasOcultas: [],
  mensalidadeValor: 0,
  vencimentoDia: 10,
  multaPct: 2,
  jurosMesPct: 1,
  avisoAtrasoDias: 5,
  callmebot: false,
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
    agendaIcs: str(p.agendaIcs, ""),
    vapidKey: str(p.vapidKey, ""),
    abasOcultas: Array.isArray(p.abasOcultas) ? p.abasOcultas.filter((x): x is string => typeof x === "string") : [],
    mensalidadeValor: typeof p.mensalidadeValor === "number" && p.mensalidadeValor >= 0 ? p.mensalidadeValor : 0,
    multaPct: typeof p.multaPct === "number" && p.multaPct >= 0 && p.multaPct <= 20 ? p.multaPct : 2,
    jurosMesPct: typeof p.jurosMesPct === "number" && p.jurosMesPct >= 0 && p.jurosMesPct <= 20 ? p.jurosMesPct : 1,
    avisoAtrasoDias: typeof p.avisoAtrasoDias === "number" && p.avisoAtrasoDias >= 0 && p.avisoAtrasoDias <= 60 ? p.avisoAtrasoDias : 5,
    callmebot: p.callmebot === true,
    vencimentoDia: typeof p.vencimentoDia === "number" && p.vencimentoDia >= 1 && p.vencimentoDia <= 28 ? p.vencimentoDia : 10,
    aulasPorGrau: typeof p.aulasPorGrau === "number" && p.aulasPorGrau >= 1 ? p.aulasPorGrau : 9,
    grausPorFaixa: typeof p.grausPorFaixa === "number" && p.grausPorFaixa >= 1 ? p.grausPorFaixa : 4,
    faixasPublicasRoleta: Array.isArray(p.faixasPublicasRoleta) ? p.faixasPublicasRoleta.filter((x): x is string => typeof x === "string") : ["Azul", "Amarela"],
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
