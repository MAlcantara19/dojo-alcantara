/** Abas do painel (também aparecem no menu lateral, em “Área do professor”). */
export type Aba = "resumo" | "mural" | "turmas" | "alunos" | "chamada" | "experimentais" | "mensalidades" | "exames" | "campeonatos" | "aulas" | "estudo" | "galeria" | "resultados" | "equipe" | "parcerias" | "sugestoes" | "site";
export const ABAS_ADMIN: [Aba, string, boolean][] = [
  ["resumo", "Resumo", false],
  ["mural", "Mural e calendário", false],
  ["turmas", "Turmas", false],
  ["alunos", "Alunos", false],
  ["chamada", "Chamada", false],
  ["experimentais", "Aulas experimentais", false],
  ["mensalidades", "Mensalidades", true],
  ["exames", "Exames de faixa", false],
  ["campeonatos", "Campeonatos", false],
  ["aulas", "Aulas", false],
  ["estudo", "Estudo", false],
  ["galeria", "Galeria", false],
  ["resultados", "Resultados", false],
  ["equipe", "Equipe", true],
  ["parcerias", "Parcerias", true],
  ["sugestoes", "Sugestões", true],
  ["site", "Site", true],
];

/** Funções em preparação: só aparecem quando ligadas em Site > Aparência > “Em preparação”. */
export const EXTRAS: [string, string][] = [
  ["exames", "Exames de faixa (datas dos exames e quem vai fazer)"],
  ["palavrasFaixa", "Simulados de palavras por faixa (usa as listas “Faixa …” da roleta)"],
];
export const abaLigada = (aba: string, extras: string[]) => aba !== "exames" || extras.includes("exames");
