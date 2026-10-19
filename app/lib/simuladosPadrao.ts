import { basica } from "./palavras";
import { simulados as basicos, type Pergunta } from "./simulados";
import { familias, grupos, tecnicas, type Familia, type GrupoId } from "./tecnicas";

/* Simulados padrão, montados a partir das listas do site (vocabulário, famílias, grupos do Gokyo e
   solo). São sempre os mesmos (sorteio com semente fixa). Viram simulados editáveis quando você
   usa "Importar os simulados padrão" no painel. */

export type SimuladoBase = { id: string; titulo: string; descricao: string; perguntas: Pergunta[] };

function rng(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function criar(semente: number) {
  const r = rng(semente);
  const embaralhar = <T,>(a: T[]): T[] => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const pergunta = (enunciado: string, certa: string, pool: string[], explicacao: string, nOpcoes = 4): Pergunta => {
    const erradas = embaralhar(Array.from(new Set(pool)).filter((t) => t !== certa)).slice(0, nOpcoes - 1);
    const opcoes = embaralhar([certa, ...erradas]);
    return { pergunta: enunciado, opcoes, correta: opcoes.indexOf(certa), explicacao };
  };
  return { embaralhar, pergunta };
}

function vocabulario(): SimuladoBase {
  const { embaralhar, pergunta } = criar(11);
  const alvo = embaralhar(basica).slice(0, 15);
  const pool = basica.map((p) => p.significado);
  return {
    id: "vocabulario",
    titulo: "Vocabulário do judô",
    descricao: "O significado das palavras usadas no dojô.",
    perguntas: alvo.map((p) => pergunta(`O que significa “${p.termo}”?`, p.significado, pool, `${p.termo}: ${p.significado}.`)),
  };
}

const nomeFamilia: Record<Familia, string> = {
  "Te-waza": "técnicas de mão",
  "Koshi-waza": "técnicas de quadril",
  "Ashi-waza": "técnicas de perna",
  "Ma-sutemi-waza": "técnicas de sacrifício para trás",
  "Yoko-sutemi-waza": "técnicas de sacrifício lateral",
  "Osaekomi-waza": "técnicas de imobilização",
  "Shime-waza": "técnicas de estrangulamento",
  "Kansetsu-waza": "técnicas de chave de articulação",
};

function familiasSim(): SimuladoBase {
  const { embaralhar, pergunta } = criar(22);
  const todas = Object.keys(familias) as Familia[];
  const qs: Pergunta[] = [];
  todas.forEach((f) => {
    qs.push(pergunta(`O que são as técnicas ${f}?`, nomeFamilia[f], todas.map((x) => nomeFamilia[x]), `${f} são as ${nomeFamilia[f]}.`));
    qs.push(pergunta(`Como se chamam as ${nomeFamilia[f]}?`, f, todas, `As ${nomeFamilia[f]} são chamadas de ${f}.`));
  });
  const amostra = embaralhar(tecnicas.filter((t) => t.familia && !["Dakiage"].includes(t.nome))).slice(0, 6);
  amostra.forEach((t) => qs.push(pergunta(`A técnica ${t.nome} pertence a qual família?`, t.familia as string, todas, `${t.nome} é ${t.familia} (${nomeFamilia[t.familia as Familia]}).`)));
  return { id: "familias", titulo: "Famílias de técnicas", descricao: "Te-waza, Koshi-waza, Ashi-waza, sutemi, solo e mais.", perguntas: embaralhar(qs).slice(0, 15) };
}

function gokyoSim(): SimuladoBase {
  const { embaralhar, pergunta } = criar(33);
  const ids: GrupoId[] = ["1", "2", "3", "4", "5", "6"];
  const qs: Pergunta[] = [];
  ids.forEach((g) => {
    const doGrupo = tecnicas.filter((t) => t.grupo === g);
    const dosOutros = tecnicas.filter((t) => t.categoria === "Nage-waza" && t.grupo !== g && t.grupo !== "S").map((t) => t.nome);
    embaralhar(doGrupo)
      .slice(0, 2)
      .forEach((t) => qs.push(pergunta(`Qual destas técnicas pertence ao ${grupos[g].titulo}?`, t.nome, dosOutros, `${t.nome} é do ${grupos[g].titulo}.`)));
  });
  return { id: "gokyo", titulo: "Grupos do Gokyo", descricao: "Em qual grupo cada técnica de projeção está.", perguntas: embaralhar(qs) };
}

function soloSim(): SimuladoBase {
  const { embaralhar, pergunta } = criar(44);
  const opcoes = ["Imobilização", "Estrangulamento", "Chave de articulação", "Projeção"];
  const rotulo: Record<string, string> = { "Osaekomi-waza": opcoes[0], "Shime-waza": opcoes[1], "Kansetsu-waza": opcoes[2] };
  const todas = tecnicas.filter((t) => t.categoria === "Katame-waza");
  const amostra = [
    ...embaralhar(todas.filter((t) => t.familia === "Osaekomi-waza")).slice(0, 4),
    ...embaralhar(todas.filter((t) => t.familia === "Shime-waza")).slice(0, 4),
    ...embaralhar(todas.filter((t) => t.familia === "Kansetsu-waza")).slice(0, 4),
  ];
  return {
    id: "solo",
    titulo: "Técnicas de solo",
    descricao: "Imobilizações, estrangulamentos e chaves de articulação.",
    perguntas: embaralhar(amostra).map((t) => pergunta(`${t.nome} é uma técnica de…`, rotulo[t.familia as string], opcoes, `${t.nome} é ${t.familia}: ${rotulo[t.familia as string].toLowerCase()}.`)),
  };
}

export const simuladosPadraoCompletos = (): SimuladoBase[] => [...basicos, vocabulario(), familiasSim(), gokyoSim(), soloSim()];
