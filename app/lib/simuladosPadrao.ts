import { basica } from "./palavras";
import { simulados as basicos, type Pergunta } from "./simulados";
import { faixas } from "./faixas";
import { familias, grupos, tecnicas, type Familia, type GrupoId, type Tecnica } from "./tecnicas";

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
  const pergunta = (enunciado: string, certa: string, pool: string[], explicacao: string, porQue?: (opcao: string) => string, nOpcoes = 4): Pergunta => {
    const erradas = embaralhar(Array.from(new Set(pool)).filter((t) => t !== certa)).slice(0, nOpcoes - 1);
    const opcoes = embaralhar([certa, ...erradas]);
    return { pergunta: enunciado, opcoes, correta: opcoes.indexOf(certa), explicacao, porque: porQue ? opcoes.map((o) => (o === certa ? "" : porQue(o))) : undefined };
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
    perguntas: alvo.map((p) =>
      pergunta(`O que significa “${p.termo}”?`, p.significado, pool, `${p.termo}: ${p.significado}.`, (op) => {
        const outro = basica.find((x) => x.significado === op)?.termo;
        return outro ? `Isso é o significado de “${outro}”, e não de “${p.termo}”.` : `Isso não é o significado de “${p.termo}”.`;
      }),
    ),
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
    qs.push(
      pergunta(`O que são as técnicas ${f}?`, nomeFamilia[f], todas.map((x) => nomeFamilia[x]), `${f} são as ${nomeFamilia[f]}.`, (op) => {
        const outra = todas.find((x) => nomeFamilia[x] === op);
        return outra ? `As ${op} são chamadas de ${outra}. As ${f} são as ${nomeFamilia[f]}.` : `Essa não é a tradução de ${f}.`;
      }),
    );
    qs.push(pergunta(`Como se chamam as ${nomeFamilia[f]}?`, f, todas, `As ${nomeFamilia[f]} são chamadas de ${f}.`, (op) => `${op} são as ${nomeFamilia[op as Familia]}, e não as ${nomeFamilia[f]}.`));
  });
  const amostra = embaralhar(tecnicas.filter((t) => t.familia && !["Dakiage"].includes(t.nome))).slice(0, 6);
  amostra.forEach((t) =>
    qs.push(pergunta(`A técnica ${t.nome} pertence a qual família?`, t.familia as string, todas, `${t.nome} é ${t.familia} (${nomeFamilia[t.familia as Familia]}).`, (op) => `${op} são as ${nomeFamilia[op as Familia]}. ${t.nome} não é dessa família: ela é ${t.familia}.`)),
  );
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
      .forEach((t) =>
        qs.push(
          pergunta(`Qual destas técnicas pertence ao ${grupos[g].titulo}?`, t.nome, dosOutros, `${t.nome} é do ${grupos[g].titulo}.`, (op) => {
            const o = tecnicas.find((x) => x.nome === op);
            const gr = o?.grupo;
            return !o || !gr || gr === "-" ? `${op} não faz parte de nenhum dos grupos do Gokyo.` : gr === "S" ? `${op} é uma das novas técnicas aceitas (Shinmeisho), não é deste grupo.` : `${op} é do ${grupos[gr].titulo}, não do ${grupos[g].titulo}.`;
          }),
        ),
      );
  });
  return { id: "gokyo", titulo: "Grupos do Gokyo", descricao: "Em qual grupo cada técnica de projeção está.", perguntas: embaralhar(qs) };
}

function soloSim(): SimuladoBase {
  const { embaralhar, pergunta } = criar(44);
  const opcoes = ["Imobilização", "Estrangulamento", "Chave de articulação", "Projeção"];
  const definicao: Record<string, string> = {
    Imobilização: "Imobilização (osaekomi-waza) prende o oponente de costas no chão.",
    Estrangulamento: "Estrangulamento (shime-waza) comprime o pescoço do oponente.",
    "Chave de articulação": "Chave de articulação (kansetsu-waza) força o cotovelo do oponente.",
    Projeção: "Projeção (nage-waza) derruba o oponente em pé.",
  };
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
    perguntas: embaralhar(amostra).map((t) =>
      pergunta(`${t.nome} é uma técnica de…`, rotulo[t.familia as string], opcoes, `${t.nome} é ${t.familia}: ${rotulo[t.familia as string].toLowerCase()}.`, (op) => `${t.nome} não é uma técnica de ${op.toLowerCase()}. ${definicao[op]}`),
    ),
  };
}

/** Um simulado para cada faixa, com as técnicas dela (monta na hora, a partir das faixas que você definiu). */
export function simuladosPorFaixa(lista: Tecnica[], faixaDe: (t: Tecnica) => string | undefined): SimuladoBase[] {
  const todas = Object.keys(familias) as Familia[];
  const saida: SimuladoBase[] = [];
  faixas.forEach((fx, n) => {
    const daFaixa = lista.filter((t) => t.familia && faixaDe(t) === fx.nome);
    if (daFaixa.length < 3) return;
    const { embaralhar, pergunta } = criar(100 + n);
    const perguntas = embaralhar(daFaixa)
      .slice(0, 15)
      .map((t) => {
        const f = t.familia as Familia;
        return pergunta(`A técnica ${t.nome} é de qual tipo?`, nomeFamilia[f], todas.map((x) => nomeFamilia[x]), `${t.nome} é ${f}: ${nomeFamilia[f]}.`, (op) => {
          const outra = todas.find((x) => nomeFamilia[x] === op);
          return outra ? `${op} são as ${outra}. ${t.nome} não é dessa família.` : `${t.nome} não é desse tipo.`;
        });
      });
    saida.push({ id: `faixa-${fx.nome.toLowerCase()}`, titulo: `Faixa ${fx.nome.toLowerCase()} · técnicas`, descricao: `As técnicas da faixa ${fx.nome.toLowerCase()} e o tipo de cada uma.`, perguntas });
  });
  return saida;
}

export const simuladosPadraoCompletos = (): SimuladoBase[] => [...basicos, vocabulario(), familiasSim(), gokyoSim(), soloSim()];
