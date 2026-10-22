/* Ordem das faixas no dojô. "cor" aceita cor ou degradê (CSS). */
export const faixas = [
  { nome: "Branca", cor: "#f4f1ff" },
  { nome: "Azul", cor: "#2b6cd8" },
  { nome: "Amarela", cor: "#f2d23c" },
  { nome: "Laranja", cor: "#f08a24" },
  { nome: "Verde", cor: "#2f9e5b" },
  { nome: "Roxa", cor: "#8a4bd6" },
  { nome: "Marrom", cor: "#7a4a2a" },
  { nome: "Preta", cor: "#111111" },
];

/* Graus mais altos, só para a barra decorativa do início. */
export const faixasAltas = [
  { nome: "Vermelha e branca", cor: "repeating-linear-gradient(90deg,#d9334a 0 12px,#ffffff 12px 24px)" },
  { nome: "Vermelha", cor: "#d9334a" },
];

export const corDaFaixa = (nome?: string) => faixas.find((f) => f.nome === nome)?.cor;

/* Graus da faixa preta (dan), com o nome em japonês. Do 6º ao 8º a faixa é vermelha e branca; 9º e 10º, vermelha. */
export const DANS = [
  { n: 1, jp: "Shodan" },
  { n: 2, jp: "Nidan" },
  { n: 3, jp: "Sandan" },
  { n: 4, jp: "Yondan" },
  { n: 5, jp: "Godan" },
  { n: 6, jp: "Rokudan" },
  { n: 7, jp: "Shichidan" },
  { n: 8, jp: "Hachidan" },
  { n: 9, jp: "Kudan" },
  { n: 10, jp: "Judan" },
];
export const nomeDan = (dan?: number) => {
  const d = DANS.find((x) => x.n === dan);
  return d ? `${d.n}º Dan (${d.jp})` : "";
};
/** Faixa por extenso, com o dan quando houver: “Preta · 4º Dan (Yondan)”. */
export const faixaPorExtenso = (faixa?: string, dan?: number) => (faixa ? (faixa === "Preta" && dan ? `Preta · ${nomeDan(dan)}` : faixa) : "");
/** Cor da borda da foto: do 6º ao 8º dan coral (vermelha e branca), 9º e 10º vermelha. */
export const corComDan = (faixa?: string, dan?: number) => (faixa === "Preta" && dan && dan >= 9 ? faixasAltas[1].cor : faixa === "Preta" && dan && dan >= 6 ? faixasAltas[0].cor : corDaFaixa(faixa));
