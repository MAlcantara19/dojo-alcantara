/** Abas do painel (também aparecem no menu lateral, em “Área do professor”). */
export type Aba = "resumo" | "mural" | "turmas" | "alunos" | "chamada" | "campeonatos" | "aulas" | "estudo" | "galeria" | "resultados" | "equipe" | "parcerias" | "site";
export const ABAS_ADMIN: [Aba, string, boolean][] = [
  ["resumo", "Resumo", false],
  ["mural", "Mural e calendário", false],
  ["turmas", "Turmas", false],
  ["alunos", "Alunos", false],
  ["chamada", "Chamada", false],
  ["campeonatos", "Campeonatos", false],
  ["aulas", "Aulas", false],
  ["estudo", "Estudo", false],
  ["galeria", "Galeria", false],
  ["resultados", "Resultados", false],
  ["equipe", "Equipe", true],
  ["parcerias", "Parcerias", true],
  ["site", "Site", true],
];
