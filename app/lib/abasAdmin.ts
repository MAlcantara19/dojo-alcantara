/** Abas do painel (também aparecem no menu lateral, em “Área do professor”). */
export type Aba = "resumo" | "mural" | "turmas" | "alunos" | "aulas" | "estudo" | "galeria" | "resultados" | "equipe" | "site";
export const ABAS_ADMIN: [Aba, string, boolean][] = [
  ["resumo", "Resumo", false],
  ["mural", "Mural e calendário", false],
  ["turmas", "Turmas", false],
  ["alunos", "Alunos", false],
  ["aulas", "Aulas", false],
  ["estudo", "Estudo", false],
  ["galeria", "Galeria", false],
  ["resultados", "Resultados", false],
  ["equipe", "Equipe", true],
  ["site", "Site", true],
];
