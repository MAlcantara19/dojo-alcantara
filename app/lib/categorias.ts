/*
 * Categorias de competição (sugestão automática — sempre confira no regulamento do campeonato).
 * Classe pela idade no ano do campeonato (ano do campeonato − ano de nascimento).
 * Pesos olímpicos (Sub-21, Sênior e Veteranos) e de Sub-18 seguem a tabela da Federação Internacional (IJF).
 */
export type Sexo = "M" | "F";

export function classeDeIdade(nascimento: string | undefined, anoCampeonato: number): string {
  if (!nascimento) return "";
  const idade = anoCampeonato - Number(nascimento.slice(0, 4));
  if (idade <= 8) return "Sub-9";
  if (idade <= 10) return "Sub-11";
  if (idade <= 12) return "Sub-13";
  if (idade <= 14) return "Sub-15";
  if (idade <= 17) return "Sub-18";
  if (idade <= 20) return "Sub-21";
  if (idade <= 29) return "Sênior";
  return `Veterano M${Math.min(10, Math.floor((idade - 30) / 5) + 1)}`;
}

const ADULTO: Record<Sexo, string[]> = {
  M: ["-60 kg", "-66 kg", "-73 kg", "-81 kg", "-90 kg", "-100 kg", "+100 kg"],
  F: ["-48 kg", "-52 kg", "-57 kg", "-63 kg", "-70 kg", "-78 kg", "+78 kg"],
};
const SUB18: Record<Sexo, string[]> = {
  M: ["-50 kg", "-55 kg", "-60 kg", "-66 kg", "-73 kg", "-81 kg", "-90 kg", "+90 kg"],
  F: ["-40 kg", "-44 kg", "-48 kg", "-52 kg", "-57 kg", "-63 kg", "-70 kg", "+70 kg"],
};

/** Lista de pesos da classe (vazia para as classes infantis: aí o peso é digitado conforme o regulamento). */
export function pesosDaClasse(classe: string, sexo: Sexo): string[] {
  if (classe === "Sub-18") return SUB18[sexo];
  if (classe === "Sub-21" || classe === "Sênior" || classe.startsWith("Veterano")) return ADULTO[sexo];
  return [];
}

/** Sugere a categoria de peso a partir do peso do atleta. */
export function sugerirPeso(classe: string, sexo: Sexo, peso: number | null): string {
  const lista = pesosDaClasse(classe, sexo);
  if (!lista.length || !peso) return "";
  for (const c of lista) {
    if (c.startsWith("-") && peso <= Number(c.replace(/[^\d]/g, ""))) return c;
  }
  return lista[lista.length - 1];
}
