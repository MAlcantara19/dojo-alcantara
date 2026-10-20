/* Técnicas do judô: as 100 da lista do Kodokan (01/10/2022) + Dakiage (que aparece na lista das
   "novas técnicas aceitas" do dojô). Os GRUPOS (1º ao 5º = Gokyo, 6º = Rokukyo e Shinmeisho)
   seguem as tabelas que você enviou. A FAIXA, o PDF e o vídeo de cada técnica você edita no
   painel do professor (não precisa mexer aqui). Só a faixa inicial azul já vem preenchida. */

export type Categoria = "Nage-waza" | "Katame-waza";
export type Familia =
  | "Te-waza"
  | "Koshi-waza"
  | "Ashi-waza"
  | "Ma-sutemi-waza"
  | "Yoko-sutemi-waza"
  | "Osaekomi-waza"
  | "Shime-waza"
  | "Kansetsu-waza";
export type GrupoId = "1" | "2" | "3" | "4" | "5" | "6" | "S" | "-";

export type Tecnica = {
  id: string;
  nome: string;
  categoria: Categoria;
  familia?: Familia;
  grupo: GrupoId;
  faixa?: string;
  nota?: string;
};

export const grupos: Record<GrupoId, { titulo: string; cor: string }> = {
  "1": { titulo: "1º grupo · Dai-ikkyo", cor: "#f2d23c" },
  "2": { titulo: "2º grupo · Dai-nikyo", cor: "#f08a24" },
  "3": { titulo: "3º grupo · Dai-sankyo", cor: "#2f9e5b" },
  "4": { titulo: "4º grupo · Dai-yonkyo", cor: "#8a4bd6" },
  "5": { titulo: "5º grupo · Dai-gokyo", cor: "#8b4a2b" },
  "6": { titulo: "6º grupo · Rokukyo", cor: "#111111" },
  S: { titulo: "Golpes adicionais · Shinmeisho", cor: "#8c86a3" },
  "-": { titulo: "Golpes adicionais", cor: "#8c86a3" },
};

export const familias: Record<Familia, { titulo: string; cor: string }> = {
  "Te-waza": { titulo: "Te-waza · Técnicas de Mão", cor: "#12a39a" },
  "Koshi-waza": { titulo: "Koshi-waza · Técnicas de Quadril", cor: "#cf3d9a" },
  "Ashi-waza": { titulo: "Ashi-waza · Técnicas de Perna", cor: "#6e7a8c" },
  "Ma-sutemi-waza": { titulo: "Ma-sutemi-waza · Sacrifício para Trás", cor: "#a8a29e" },
  "Yoko-sutemi-waza": { titulo: "Yoko-sutemi-waza · Sacrifício Lateral", cor: "#d98ca3" },
  "Osaekomi-waza": { titulo: "Osaekomi-waza · Imobilizações", cor: "#7a8699" },
  "Shime-waza": { titulo: "Shime-waza · Estrangulamentos", cor: "#5d6779" },
  "Kansetsu-waza": { titulo: "Kansetsu-waza · Chaves de Articulação", cor: "#929caf" },
};

/* Faixa sugerida pelo grupo do Gokyo (você pode trocar técnica por técnica no painel). */
export const faixaPorGrupo: Partial<Record<GrupoId, string>> = {
  "1": "Amarela",
  "2": "Laranja",
  "3": "Verde",
  "4": "Roxa",
  "5": "Marrom",
  "6": "Preta",
};

const porFamilia: Record<Familia, string[]> = {
  "Te-waza": ["Seoi-nage", "Ippon-seoi-nage", "Seoi-otoshi", "Tai-otoshi", "Kata-guruma", "Sukui-nage", "Obi-otoshi", "Uki-otoshi", "Sumi-otoshi", "Yama-arashi", "Obi-tori-gaeshi", "Morote-gari", "Kuchiki-taoshi", "Kibisu-gaeshi", "Uchi-mata-sukashi", "Ko-uchi-gaeshi"],
  "Koshi-waza": ["Uki-goshi", "O-goshi", "Koshi-guruma", "Tsurikomi-goshi", "Sode-tsurikomi-goshi", "Harai-goshi", "Tsuri-goshi", "Hane-goshi", "Utsuri-goshi", "Ushiro-goshi"],
  "Ashi-waza": ["De-ashi-harai", "Hiza-guruma", "Sasae-tsurikomi-ashi", "O-soto-gari", "O-uchi-gari", "Ko-soto-gari", "Ko-uchi-gari", "Okuri-ashi-harai", "Uchi-mata", "Ko-soto-gake", "Ashi-guruma", "Harai-tsurikomi-ashi", "O-guruma", "O-soto-guruma", "O-soto-otoshi", "Tsubame-gaeshi", "O-soto-gaeshi", "O-uchi-gaeshi", "Hane-goshi-gaeshi", "Harai-goshi-gaeshi", "Uchi-mata-gaeshi"],
  "Ma-sutemi-waza": ["Tomoe-nage", "Sumi-gaeshi", "Hikikomi-gaeshi", "Tawara-gaeshi", "Ura-nage"],
  "Yoko-sutemi-waza": ["Yoko-otoshi", "Tani-otoshi", "Hane-makikomi", "Soto-makikomi", "Uchi-makikomi", "Uki-waza", "Yoko-wakare", "Yoko-guruma", "Yoko-gake", "Daki-wakare", "O-soto-makikomi", "Uchi-mata-makikomi", "Harai-makikomi", "Ko-uchi-makikomi", "Kani-basami", "Kawazu-gake"],
  "Osaekomi-waza": ["Kesa-gatame", "Kuzure-kesa-gatame", "Ushiro-kesa-gatame", "Kata-gatame", "Kami-shiho-gatame", "Kuzure-kami-shiho-gatame", "Yoko-shiho-gatame", "Tate-shiho-gatame", "Uki-gatame", "Ura-gatame"],
  "Shime-waza": ["Nami-juji-jime", "Gyaku-juji-jime", "Kata-juji-jime", "Hadaka-jime", "Okuri-eri-jime", "Kataha-jime", "Katate-jime", "Ryote-jime", "Sode-guruma-jime", "Tsukkomi-jime", "Sankaku-jime", "Do-jime"],
  "Kansetsu-waza": ["Ude-garami", "Ude-hishigi-juji-gatame", "Ude-hishigi-ude-gatame", "Ude-hishigi-hiza-gatame", "Ude-hishigi-waki-gatame", "Ude-hishigi-hara-gatame", "Ude-hishigi-ashi-gatame", "Ude-hishigi-te-gatame", "Ude-hishigi-sankaku-gatame", "Ashi-garami"],
};

const porGrupo: Record<Exclude<GrupoId, "-">, string[]> = {
  "1": ["De-ashi-harai", "Hiza-guruma", "Sasae-tsurikomi-ashi", "Uki-goshi", "O-soto-gari", "O-goshi", "O-uchi-gari", "Seoi-nage"],
  "2": ["Ko-soto-gari", "Ko-uchi-gari", "Koshi-guruma", "Tsurikomi-goshi", "Okuri-ashi-harai", "Tai-otoshi", "Harai-goshi", "Uchi-mata"],
  "3": ["Ko-soto-gake", "Tsuri-goshi", "Yoko-otoshi", "Ashi-guruma", "Hane-goshi", "Harai-tsurikomi-ashi", "Tomoe-nage", "Kata-guruma"],
  "4": ["Sumi-gaeshi", "Tani-otoshi", "Hane-makikomi", "Sukui-nage", "Utsuri-goshi", "O-guruma", "Soto-makikomi", "Uki-otoshi"],
  "5": ["O-soto-guruma", "Uki-waza", "Yoko-wakare", "Yoko-guruma", "Ushiro-goshi", "Ura-nage", "Sumi-otoshi", "Yoko-gake"],
  "6": ["Obi-otoshi", "Seoi-otoshi", "Yama-arashi", "O-soto-otoshi", "Daki-wakare", "Hikikomi-gaeshi", "Tawara-gaeshi", "Uchi-makikomi"],
  S: ["Morote-gari", "Kuchiki-taoshi", "Kibisu-gaeshi", "Uchi-mata-sukashi", "Dakiage", "Tsubame-gaeshi", "Ko-uchi-gaeshi", "O-uchi-gaeshi", "O-soto-gaeshi", "Harai-goshi-gaeshi", "Uchi-mata-gaeshi", "Hane-goshi-gaeshi", "Kani-basami", "O-soto-makikomi", "Kawazu-gake", "Harai-makikomi", "Uchi-mata-makikomi"],
};

const grupoDe = new Map<string, GrupoId>();
(Object.keys(porGrupo) as Exclude<GrupoId, "-">[]).forEach((g) => porGrupo[g].forEach((n) => grupoDe.set(n, g)));

// Faixa inicial que você informou (pode ser trocada no painel).
const faixaInicial: Record<string, { faixa: string; nota?: string }> = {
  "De-ashi-harai": { faixa: "Azul" },
  "O-soto-gari": { faixa: "Azul" },
  "Uki-goshi": { faixa: "Azul" },
  "Seoi-nage": { faixa: "Azul" },
  "Kesa-gatame": { faixa: "Azul" },
  "Kata-gatame": { faixa: "Azul" },
  "Kuzure-kesa-gatame": { faixa: "Azul" },
  "Ushiro-kesa-gatame": { faixa: "Azul", nota: "Nome em desuso no dojô; mantido porque os alunos já o conhecem." },
};

const nagePorFamilia: Familia[] = ["Te-waza", "Koshi-waza", "Ashi-waza", "Ma-sutemi-waza", "Yoko-sutemi-waza"];

const ordemG: GrupoId[] = ["1", "2", "3", "4", "5", "6", "S", "-"];
const ordemF = Object.keys(porFamilia) as Familia[];
const chaveOrdem = (t: Tecnica): number[] => {
  if (t.categoria === "Katame-waza") return [2, ordemF.indexOf(t.familia as Familia), porFamilia[t.familia as Familia].indexOf(t.nome)];
  if (t.grupo !== "-") return [0, ordemG.indexOf(t.grupo), porGrupo[t.grupo].indexOf(t.nome)];
  return [1, t.familia ? ordemF.indexOf(t.familia) : 99, t.familia ? porFamilia[t.familia].indexOf(t.nome) : 0];
};

const montadas: Tecnica[] = [
  ...(Object.keys(porFamilia) as Familia[]).flatMap((familia) =>
    porFamilia[familia].map((nome): Tecnica => {
      const nage = nagePorFamilia.includes(familia);
      return {
        id: nome.toLowerCase(),
        nome,
        categoria: nage ? "Nage-waza" : "Katame-waza",
        familia,
        grupo: nage ? (grupoDe.get(nome) ?? "-") : "-",
        ...faixaInicial[nome],
      };
    }),
  ),
  // Aparece na lista de novas técnicas aceitas do dojô, mas não na lista das 100 do Kodokan (2022).
  { id: "dakiage", nome: "Dakiage", categoria: "Nage-waza", grupo: "S", nota: "Fora da lista das 100 técnicas do Kodokan (2022)." },
];

// Dentro de cada grupo, na mesma ordem das tabelas do Kodokan.
export const tecnicas: Tecnica[] = [...montadas].sort((a, b) => {
  const x = chaveOrdem(a);
  const y = chaveOrdem(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
});

export function corDe(t: Tecnica): string {
  if (t.categoria === "Katame-waza" && t.familia) return familias[t.familia].cor;
  return grupos[t.grupo].cor;
}

export function rotuloGrupo(t: Tecnica): string {
  return t.categoria === "Katame-waza" && t.familia ? familias[t.familia].titulo : grupos[t.grupo].titulo;
}

export function linkVideo(nome: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent("Kodokan " + nome)}`;
}

export type FaixaEfetiva = { faixa?: string; sugerida: boolean };

/** Faixa que vale para a técnica: a salva no painel, senão a inicial, senão a sugerida pelo grupo. */
export function faixaEfetiva(t: Tecnica, cfg?: { faixa?: string }): FaixaEfetiva {
  if (cfg?.faixa) return { faixa: cfg.faixa, sugerida: false };
  if (t.faixa) return { faixa: t.faixa, sugerida: false };
  if (t.categoria === "Nage-waza") {
    const f = faixaPorGrupo[t.grupo];
    if (f) return { faixa: f, sugerida: true };
  }
  return { sugerida: false };
}

/* ---------- Catálogo editável pelo painel ---------- */
export type AjusteTecnica = { nome?: string; proibida?: boolean; ocultar?: boolean; custom?: boolean; categoria?: string; familia?: string; grupo?: string };

const categoriaOk = (v?: string): v is Categoria => v === "Nage-waza" || v === "Katame-waza";
const familiaOk = (v?: string): v is Familia => Boolean(v && v in familias);
const grupoOk = (v?: string): v is GrupoId => Boolean(v && v in grupos);

/** As técnicas do site: as da lista do Kodokan (com o nome que você editou, ou escondidas) + as que você criou. */
export function montarCatalogo(ajustes: Record<string, AjusteTecnica>, incluirEscondidas = false): Tecnica[] {
  const base = tecnicas.filter((t) => incluirEscondidas || !ajustes[t.id]?.ocultar).map((t) => ({ ...t, nome: ajustes[t.id]?.nome || t.nome }));
  const extras: Tecnica[] = Object.entries(ajustes)
    .filter(([, a]) => a.custom && a.nome && (incluirEscondidas || !a.ocultar))
    .map(([id, a]) => {
      const categoria: Categoria = categoriaOk(a.categoria) ? a.categoria : "Nage-waza";
      const familia: Familia | undefined = familiaOk(a.familia) ? a.familia : categoria === "Katame-waza" ? "Osaekomi-waza" : undefined;
      const grupo: GrupoId = categoria === "Nage-waza" && grupoOk(a.grupo) ? a.grupo : "-";
      return { id, nome: a.nome as string, categoria, familia, grupo };
    })
    .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"));
  return [...base, ...extras];
}

/* Técnicas hoje proibidas em campeonatos (você pode marcar outras no painel). */
const proibidasInicial = new Set(["kani-basami"]);
export const ehProibida = (t: Tecnica, ajuste?: { proibida?: boolean }): boolean => (typeof ajuste?.proibida === "boolean" ? ajuste.proibida : proibidasInicial.has(t.id));
