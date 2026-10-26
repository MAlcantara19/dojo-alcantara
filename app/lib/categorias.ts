/*
 * Tabela de pesos 2026 da Confederada Rio (enviada pelo sensei).
 * A classe é pela idade no ano do campeonato (ano do campeonato − ano de nascimento).
 * Se a federação mudar a tabela, é só ajustar os números aqui.
 */
export type Sexo = "M" | "F";

export const CLASSES = [
  { nome: "Sub-9", de: 7, ate: 8 },
  { nome: "Sub-11", de: 9, ate: 10 },
  { nome: "Sub-13", de: 11, ate: 12 },
  { nome: "Sub-15", de: 13, ate: 14 },
  { nome: "Sub-18", de: 15, ate: 17 },
  { nome: "Sub-21", de: 18, ate: 20 },
  { nome: "Sênior", de: 21, ate: 30 },
  { nome: "Veterano 1", de: 31, ate: 37 },
  { nome: "Veterano 2", de: 38, ate: 46 },
  { nome: "Veterano 3", de: 47, ate: 200 },
];

export function classeDeIdade(nascimento: string | undefined, anoCampeonato: number): string {
  if (!nascimento) return "";
  const idade = anoCampeonato - Number(nascimento.slice(0, 4));
  return CLASSES.find((c) => idade >= c.de && idade <= c.ate)?.nome ?? (idade < 7 ? "Abaixo do Sub-9" : "");
}

const NOMES = ["S. Ligeiro", "Ligeiro", "M. Leve", "Leve", "M. Médio", "Médio", "M. Pesado", "Pesado", "Extra"];
type Limites = (number | null)[]; // limites “até X kg” na ordem dos nomes; null = não existe nessa classe

// Os 8 primeiros números são “até X kg”; a última categoria existente é “acima” do limite anterior.
const TABELA: Record<Sexo, Record<string, Limites>> = {
  F: {
    "Sub-9": [24, 26, 28, 31, 34, 38, 42, 46],
    "Sub-11": [28, 30, 33, 36, 40, 45, 50, 55],
    "Sub-13": [32, 36, 40, 44, 48, 52, 57, 63],
    "Sub-15": [36, 40, 44, 48, 52, 57, 63, 70],
    "Sub-18": [40, 44, 48, 52, 57, 63, 70],
    adulto: [null, 48, 52, 57, 63, 70, 78],
  },
  M: {
    "Sub-9": [24, 26, 28, 31, 34, 38, 42, 46],
    "Sub-11": [28, 30, 33, 36, 40, 45, 50, 55],
    "Sub-13": [35, 40, 45, 50, 55, 60, 66, 73],
    "Sub-15": [40, 45, 50, 55, 60, 66, 73, 81],
    "Sub-18": [50, 55, 60, 66, 73, 81, 90],
    adulto: [null, 60, 66, 73, 81, 90, 100],
  },
};

export type Categoria = { nome: string; min: number; max: number | null; rotulo: string };

/** Todas as categorias da classe, em ordem, com o intervalo de peso de cada uma. */
export function categoriasDaClasse(classe: string, sexo: Sexo): Categoria[] {
  const lim = TABELA[sexo][classe] ?? (classe && !classe.startsWith("Sub") && !classe.startsWith("Abaixo") ? TABELA[sexo].adulto : (classe === "Sub-21" ? TABELA[sexo].adulto : undefined));
  if (!lim) return [];
  const saida: Categoria[] = [];
  let anterior = 0;
  lim.forEach((max, i) => {
    if (max === null) return;
    saida.push({ nome: NOMES[i], min: anterior, max, rotulo: `Até ${max} kg` });
    anterior = max;
  });
  // a última é “acima” do último limite
  saida.push({ nome: NOMES[lim.length], min: anterior, max: null, rotulo: `Acima de ${anterior} kg` });
  return saida;
}

/** A categoria em que o peso cai (a mais leve que comporta o peso). */
export function categoriaDoPeso(classe: string, sexo: Sexo, peso: number | null): Categoria | null {
  const cats = categoriasDaClasse(classe, sexo);
  if (!cats.length || !peso) return null;
  return cats.find((c) => c.max === null || peso <= c.max) ?? cats[cats.length - 1];
}

/** Texto curto “M. Pesado (até 100 kg)” para guardar na inscrição. */
export const textoCategoria = (c: Categoria | null) => (c ? `${c.nome} (${c.max === null ? `acima de ${c.min}` : `até ${c.max}`} kg)` : "");

/** Distâncias: quanto falta para o limite da categoria e quanto perder para a de baixo. */
export function distancias(cats: Categoria[], c: Categoria, peso: number) {
  const i = cats.findIndex((x) => x.nome === c.nome);
  const abaixo = i > 0 ? cats[i - 1] : null;
  return {
    folga: c.max === null ? null : Math.round((c.max - peso) * 10) / 10,
    perderParaDescer: abaixo && abaixo.max !== null ? Math.round((peso - abaixo.max) * 10) / 10 : null,
    abaixo,
    acima: i < cats.length - 1 ? cats[i + 1] : null,
  };
}

// Compatibilidade com o código anterior
export const pesosDaClasse = (classe: string, sexo: Sexo) => categoriasDaClasse(classe, sexo).map((c) => textoCategoria(c));
export const sugerirPeso = (classe: string, sexo: Sexo, peso: number | null) => textoCategoria(categoriaDoPeso(classe, sexo, peso));
